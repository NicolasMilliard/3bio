import { useAuthenticatedUser, useLogout } from '@lens-protocol/react';
import { useConnect, useConnection, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useLensLogin } from './useLensLogin';
import { useLensProfiles } from './useLensProfiles';

export const useAuthState = () => {
  const connection = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();

  const { execute: lensLogout } = useLogout();
  const loginWithLens = useLensLogin();

  const { data: authenticatedUser } = useAuthenticatedUser();

  const {
    profiles,
    activeProfile,
    loading: profilesLoading,
  } = useLensProfiles();

  const isConnected = connection.isConnected;
  const isConnecting = connect.isPending;
  const isDisconnecting = disconnect.isPending;

  const handleConnectWallet = () =>
    connect.mutate({
      connector: injected(),
    });

  const handleDisconnect = async () => {
    try {
      await Promise.allSettled([
        authenticatedUser ? lensLogout() : Promise.resolve(),
        disconnect.mutateAsync(),
      ]);
    } catch (error) {
      console.warn('[useAuthState] disconnect error', error);
    }
  };

  const switchProfile = async (profileAddress: string) => {
    const profile = profiles.find((p) => (p.address = profileAddress));

    if (!profile || profile.isActive) return;

    await loginWithLens(profile.accountAvailable);
  };

  return {
    isConnected,
    profiles,
    activeProfile,

    activeDisplayName: activeProfile?.displayName ?? 'Select profile',
    activeAvatar: activeProfile?.avatar,

    connectWallet: handleConnectWallet,
    disconnectWallet: handleDisconnect,
    switchProfile,

    profilesLoading,
    isConnecting,
    isDisconnecting,
  };
};
