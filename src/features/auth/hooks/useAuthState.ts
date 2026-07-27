import { useAuthenticatedUser, useLogout } from '@lens-protocol/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useConnect, useConnection, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useLensLogin } from './useLensLogin';
import { useLensProfiles } from './useLensProfiles';

const wasRejectedByUser = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return (
    message.includes('reject') ||
    message.includes('denied') ||
    message.includes('declined') ||
    message.includes('cancel')
  );
};

export const useDisconnectWallet = () => {
  const disconnect = useDisconnect();
  const { data: authenticatedUser } = useAuthenticatedUser();
  const { execute: lensLogout } = useLogout();
  const disconnectInFlight = useRef(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const disconnectWallet = async () => {
    if (disconnectInFlight.current) return;

    disconnectInFlight.current = true;
    setIsDisconnecting(true);

    const clearLensSession = async () => {
      if (authenticatedUser) {
        const result = await lensLogout();
        return result.isOk();
      }

      return true;
    };

    try {
      const [lensLogoutResult, walletDisconnectResult] =
        await Promise.allSettled([
          clearLensSession(),
          disconnect.mutateAsync(),
        ]);

      if (walletDisconnectResult.status === 'rejected') {
        toast.error('Could not disconnect wallet', {
          description: 'Try again, or disconnect this site from your wallet.',
        });
        return;
      }

      if (lensLogoutResult.status === 'rejected' || !lensLogoutResult.value) {
        toast.warning('Wallet disconnected', {
          description:
            'Lens could not clear the old session, so it will be checked again when you reconnect.',
        });
      }
    } catch {
      toast.error('Could not disconnect wallet', {
        description: 'Try again, or disconnect this site from your wallet.',
      });
    } finally {
      disconnectInFlight.current = false;
      setIsDisconnecting(false);
    }
  };

  return { disconnectWallet, isDisconnecting };
};

export const useAuthState = () => {
  const connection = useConnection();
  const connect = useConnect();
  const loginWithLens = useLensLogin();
  const { disconnectWallet, isDisconnecting } = useDisconnectWallet();
  const connectInFlight = useRef(false);
  const switchInFlight = useRef(false);
  const [switchingProfileAddress, setSwitchingProfileAddress] = useState<
    string | null
  >(null);

  const {
    profiles,
    activeProfile,
    loading: profilesLoading,
    error: profilesError,
  } = useLensProfiles();

  const isConnected = connection.isConnected;
  const isConnecting = connect.isPending;

  const handleConnectWallet = async () => {
    if (connectInFlight.current) return;

    connectInFlight.current = true;
    try {
      await connect.mutateAsync({
        connector: injected(),
      });
    } catch (error) {
      toast.error(
        wasRejectedByUser(error)
          ? 'Wallet connection cancelled'
          : 'Could not connect wallet',
        {
          description: wasRejectedByUser(error)
            ? 'Approve the connection in your wallet to continue.'
            : 'Unlock your wallet and try again.',
        },
      );
    } finally {
      connectInFlight.current = false;
    }
  };

  const switchProfile = async (profileAddress: string) => {
    const profile = profiles.find((p) => p.address === profileAddress);

    if (!profile || profile.isActive || switchInFlight.current) return;

    switchInFlight.current = true;
    setSwitchingProfileAddress(profile.address);

    try {
      const outcome = await loginWithLens(profile.accountAvailable);

      if (!outcome.success) {
        toast.error('Could not switch Lens profile', {
          description: outcome.message,
        });
      }
    } finally {
      switchInFlight.current = false;
      setSwitchingProfileAddress(null);
    }
  };

  return {
    isConnected,
    profiles,
    activeProfile,

    activeDisplayName: activeProfile?.displayName ?? 'Select profile',
    activeAvatar: activeProfile?.avatar,

    connectWallet: handleConnectWallet,
    disconnectWallet,
    switchProfile,

    profilesLoading,
    profilesError,
    isConnecting,
    isDisconnecting,
    switchingProfileAddress,
  };
};
