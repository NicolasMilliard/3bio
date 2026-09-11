// The small subset of the D1 binding this endpoint needs. No runtime SDK.
type WalletUsageDatabase = {
  prepare: (query: string) => {
    bind: (address: string) => {
      run: () => Promise<unknown>;
    };
  };
};

type PagesContext = {
  request: Request;
  env: { WALLET_ANALYTICS_DB?: WalletUsageDatabase };
};

const MAX_BODY_BYTES = 256;
const WALLET_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

const response = (status: number) =>
  new Response(null, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      ...(status === 405 ? { Allow: 'POST' } : {}),
    },
  });

export const onRequest = async ({ request, env }: PagesContext) => {
  if (request.method !== 'POST') return response(405);

  const database = env.WALLET_ANALYTICS_DB;
  // Core app and unconfigured previews keep working without a database.
  if (!database) return response(204);

  // Prevent other websites from submitting through a visitor's browser.
  // This is not authentication: a non-browser caller can forge Origin/address.
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return response(403);
  }

  const contentType = request.headers
    .get('Content-Type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  if (contentType !== 'application/json') return response(415);

  let payload: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return response(400);

    const decoder = new TextDecoder();
    let body = '';
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return response(413);
      }
      body += decoder.decode(value, { stream: true });
    }
    payload = JSON.parse(body + decoder.decode());
  } catch {
    return response(400);
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('wallet_address' in payload) ||
    typeof payload.wallet_address !== 'string' ||
    !WALLET_ADDRESS_PATTERN.test(payload.wallet_address) ||
    payload.wallet_address === ZERO_ADDRESS
  ) {
    return response(400);
  }

  try {
    await database
      .prepare(
        `INSERT INTO wallet_usage (wallet_address) VALUES (?)
         ON CONFLICT(wallet_address) DO UPDATE
         SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      )
      .bind(payload.wallet_address.toLowerCase())
      .run();
  } catch {
    return response(503);
  }

  return response(204);
};
