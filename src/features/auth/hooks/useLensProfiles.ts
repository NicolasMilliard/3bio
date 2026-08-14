import { formatAddress, formatToThreeBioMetadata } from '@/helpers';
import type { AccountAvailable } from '@lens-protocol/react';
import {
  useAccountsAvailable,
  useAuthenticatedUser,
} from '@lens-protocol/react';
import { useConnection } from 'wagmi';
import { isLensSessionBoundToWallet } from '../sessionBinding';

type LensProfile = {
  accountAvailable: AccountAvailable;
  address: string;
  displayName: string;
  avatar?: string;
  isActive: boolean;
};

export const useLensProfiles = () => {
  const connection = useConnection();
  const { data: authenticatedUser } = useAuthenticatedUser();

  const {
    data: accounts,
    loading,
    error,
  } = useAccountsAvailable({
    managedBy: connection.address,
  });

  const activeAddress = isLensSessionBoundToWallet(
    authenticatedUser,
    connection.address,
  )
    ? authenticatedUser?.address.toLowerCase()
    : undefined;

  const profiles: LensProfile[] =
    accounts?.items.map((item) => {
      const account = item.account;
      const profile = formatToThreeBioMetadata(account).profile;

      const address = account.address.toLowerCase();
      const isActive = activeAddress === address;

      const displayName =
        profile.name ?? account.username?.localName ?? formatAddress(address);

      const avatar = profile.avatar;

      return { accountAvailable: item, address, displayName, avatar, isActive };
    }) ?? [];

  const activeProfile = profiles.find((p) => p.isActive);

  return {
    profiles,
    activeProfile,
    loading,
    error,
  };
};
