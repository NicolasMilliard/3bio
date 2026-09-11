export const reportWalletConnection = async (
  walletAddress: string,
  fetcher: typeof fetch = fetch,
): Promise<void> => {
  try {
    await fetcher('/api/analytics/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress.toLowerCase() }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Usage reporting must never interrupt wallet connection or app use.
  }
};
