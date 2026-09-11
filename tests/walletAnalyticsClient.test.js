import { expect, test } from 'bun:test';

import { reportWalletConnection } from '../src/features/analytics/reportWalletConnection.ts';

const WALLET = '0x52908400098527886E0F7030069857D2E4169EE7';

test('reports only the normalized wallet to the same-origin analytics endpoint', async () => {
  let request;
  const fetcher = async (url, options) => {
    request = { url, options };
    return new Response(null, { status: 204 });
  };

  await reportWalletConnection(WALLET, fetcher);

  expect(request.url).toBe('/api/analytics/wallet');
  expect(request.options.method).toBe('POST');
  expect(request.options.headers).toEqual({
    'Content-Type': 'application/json',
  });
  expect(JSON.parse(request.options.body)).toEqual({
    wallet_address: WALLET.toLowerCase(),
  });
  expect(request.options.signal).toBeInstanceOf(AbortSignal);
});

test('analytics network failures never reject app work', async () => {
  await expect(
    reportWalletConnection(WALLET, async () => {
      throw new Error('Network unavailable');
    }),
  ).resolves.toBeUndefined();
});

test('an unavailable analytics backend does not fail app work or retry', async () => {
  let attempts = 0;

  await expect(
    reportWalletConnection(WALLET, async () => {
      attempts += 1;
      return new Response(null, { status: 503 });
    }),
  ).resolves.toBeUndefined();

  expect(attempts).toBe(1);
});
