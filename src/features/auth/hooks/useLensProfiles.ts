import { formatAddress, getInBioProfile } from '@/helpers';
import type { AccountAvailable } from '@lens-protocol/react';
import {
  useAccountsAvailable,
  useAuthenticatedUser,
} from '@lens-protocol/react';
import { useConnection } from 'wagmi';

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

  const activeAddress = authenticatedUser?.address.toLowerCase();

  const profiles: LensProfile[] =
    accounts?.items.map((item) => {
      const account = item.account;
      const inBioProfile = getInBioProfile(account.metadata?.attributes);

      const address = account.address.toLowerCase();
      const isActive = activeAddress === address;

      const displayName =
        inBioProfile?.name ??
        account.username?.localName ??
        formatAddress(address);

      const avatar = inBioProfile?.avatar ?? account.metadata?.picture;

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
