import { useEffect, useRef } from 'react';
import { useConnection } from 'wagmi';
import { WALLET_ANALYTICS_ENABLED } from './config';
import { reportWalletConnection } from './reportWalletConnection';

export const useWalletAnalytics = (isInternalAppPage: boolean) => {
  const { address, status } = useConnection();
  const reportedAddress = useRef<string | null>(null);

  useEffect(() => {
    if (
      !WALLET_ANALYTICS_ENABLED ||
      !isInternalAppPage ||
      status === 'disconnected'
    ) {
      reportedAddress.current = null;
      return;
    }

    // Reconnecting is transient; do not report again until a real disconnect.
    if (status !== 'connected' || !address) return;

    const normalizedAddress = address.toLowerCase();
    if (reportedAddress.current === normalizedAddress) return;

    reportedAddress.current = normalizedAddress;
    void reportWalletConnection(normalizedAddress);
  }, [address, isInternalAppPage, status]);
};
