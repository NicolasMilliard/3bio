import { Database } from 'bun:sqlite';
import { afterEach, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { onRequest } from '../functions/api/analytics/wallet.ts';

const ORIGIN = 'https://3bio.social';
const WALLET = '0x52908400098527886E0F7030069857D2E4169EE7';
const OTHER_WALLET = '0x1111111111111111111111111111111111111111';
const migration = readFileSync(
  new URL('../migrations/0001_wallet_usage.sql', import.meta.url),
  'utf8',
);
const databases = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

const setup = () => {
  const database = new Database(':memory:');
  databases.push(database);
  database.exec(migration);
  // Execute the endpoint's real SQL against SQLite, like D1's SQL engine.
  const env = {
    WALLET_ANALYTICS_DB: {
      prepare: (query) => ({
        bind: (address) => ({
          run: async () => database.prepare(query).run(address),
        }),
      }),
    },
  };
  const submit = (body = { wallet_address: WALLET }, init = {}) =>
    onRequest({
      env,
      request: new Request(`${ORIGIN}/api/analytics/wallet`, {
        method: 'POST',
        headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        ...init,
      }),
    });
  const rows = () => database.query('SELECT * FROM wallet_usage').all();
  return { database, env, submit, rows };
};

test('counts each normalized wallet once and preserves its first observation', async () => {
  const { database, submit, rows } = setup();
  const result = await submit({
    wallet_address: WALLET,
    created_at: '1900-01-01',
    updated_at: '1900-01-01',
  });
  expect(result.status).toBe(204);
  expect(result.headers.get('Cache-Control')).toBe('no-store');
  expect(result.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  expect(await result.text()).toBe('');
  const [first] = rows();
  expect(first.wallet_address).toBe(WALLET.toLowerCase());
  expect(first.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  expect(first.created_at).toBe(first.updated_at);
  expect(Math.abs(Date.now() - Date.parse(first.created_at))).toBeLessThan(
    5000,
  );

  // Seed an older last-seen value without relying on a timed test sleep.
  database.exec(
    "UPDATE wallet_usage SET updated_at = '2000-01-01T00:00:00.000Z'",
  );
  await Promise.all([
    submit(),
    submit({ wallet_address: WALLET.toLowerCase() }),
  ]);
  expect(rows()).toHaveLength(1);
  expect(rows()[0].created_at).toBe(first.created_at);
  expect(Date.parse(rows()[0].updated_at)).toBeGreaterThan(
    Date.parse('2000-01-01T00:00:00.000Z'),
  );

  await submit({ wallet_address: OTHER_WALLET });
  expect(rows()).toHaveLength(2);
  database
    .prepare('UPDATE wallet_usage SET updated_at = ? WHERE wallet_address = ?')
    .run('2000-01-01T00:00:00.000Z', OTHER_WALLET);
  const recent = database
    .query(
      `SELECT COUNT(*) AS count FROM wallet_usage
    WHERE updated_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')`,
    )
    .get();
  expect(recent.count).toBe(1);
});

test('invalid submissions never create wallet records', async () => {
  const { submit, rows } = setup();
  for (const payload of [
    null,
    [],
    {},
    { wallet_address: 123 },
    { wallet_address: `0x${'0'.repeat(40)}` },
    { wallet_address: '0x123' },
    { wallet_address: `0x${'z'.repeat(40)}` },
    { wallet_address: `${WALLET}'; DROP TABLE wallet_usage; --` },
  ]) {
    expect((await submit(payload)).status).toBe(400);
  }
  expect((await submit(null, { body: '{invalid' })).status).toBe(400);
  expect((await submit(null, { body: null })).status).toBe(400);
  expect((await submit(null, { body: ' '.repeat(257) })).status).toBe(413);
  expect(rows()).toEqual([]);
});

test('streamed request bodies are bounded without trusting Content-Length', async () => {
  const { submit, rows } = setup();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(' '.repeat(200)));
      controller.enqueue(new TextEncoder().encode(' '.repeat(100)));
      controller.close();
    },
  });
  expect((await submit(null, { body })).status).toBe(413);
  expect(rows()).toEqual([]);
});

test('rejects other origins, form submissions, and public reads', async () => {
  const { submit, rows } = setup();
  for (const origin of [
    null,
    'null',
    'https://other.example',
    `${ORIGIN}.evil.example`,
  ]) {
    const headers = { 'Content-Type': 'application/json' };
    if (origin !== null) headers.Origin = origin;
    expect((await submit(undefined, { headers })).status).toBe(403);
  }
  for (const contentType of [
    'text/plain',
    'application/x-www-form-urlencoded',
  ]) {
    expect(
      (
        await submit(undefined, {
          headers: { Origin: ORIGIN, 'Content-Type': contentType },
        })
      ).status,
    ).toBe(415);
  }
  for (const method of ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']) {
    const result = await submit(null, { method, body: undefined });
    expect(result.status).toBe(405);
    expect(result.headers.get('Allow')).toBe('POST');
    expect(result.headers.has('Access-Control-Allow-Origin')).toBe(false);
  }
  expect(rows()).toEqual([]);
});

test('missing configuration is a no-op and database failures are contained', async () => {
  const { env } = setup();
  const request = () =>
    new Request(`${ORIGIN}/api/analytics/wallet`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: WALLET }),
    });
  expect((await onRequest({ request: request(), env: {} })).status).toBe(204);
  env.WALLET_ANALYTICS_DB.prepare = () => {
    throw new Error('D1 unavailable');
  };
  const failed = await onRequest({ request: request(), env });
  expect(failed.status).toBe(503);
  expect(await failed.text()).toBe('');
  expect(failed.headers.get('Cache-Control')).toBe('no-store');
});
