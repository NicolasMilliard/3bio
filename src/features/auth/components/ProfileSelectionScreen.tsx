import { getInBioProfile } from '@/helpers';
import type { InBioProfile } from '@/schemas/inBioMetadata.schema';
import { useAccountsAvailable } from '@lens-protocol/react';
import { useConnection } from 'wagmi';
import { useLensLogin } from '../hooks/useLensLogin';
import { ProfileCard } from './ProfileCard';

import { Text } from '@/components/ui';

export const ProfileSelectionScreen = () => {
  const connection = useConnection();
  const { data: accounts } = useAccountsAvailable({
    managedBy: connection.address,
  });
  const loginWithLens = useLensLogin();

  return (
    <section className="mt-30 flex flex-col items-center gap-8 px-4 text-center">
      <div className="space-y-2">
        <Text variant="h1">Choose your profile</Text>
        <Text className="max-w-97">
          Select the profile you want to use. You can switch later from your
          dashboard.
        </Text>
      </div>

      {!accounts?.items.length && (
        <Text className="text-destructive">
          No profiles found for this wallet.
        </Text>
      )}

      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts?.items.map((item) => {
          const inBioProfile: InBioProfile | undefined = getInBioProfile(
            item.account.metadata?.attributes,
          );
          const name =
            inBioProfile?.name ?? item.account.username?.localName ?? 'Unnamed';
          const avatar = inBioProfile?.avatar ?? item.account.metadata?.picture;
          const coverPicture =
            inBioProfile?.coverPicture ?? item.account.metadata?.coverPicture;
          const avatarFallback =
            item.account.username?.localName?.[0]?.toUpperCase() ??
            name[0]?.toUpperCase() ??
            'U';

          return (
            <ProfileCard
              key={item.account.address}
              address={item.account.address}
              avatar={avatar}
              avatarFallback={avatarFallback}
              coverPicture={coverPicture}
              name={name}
              onSelect={() => {
                loginWithLens(item);
              }}
            />
          );
        })}
      </div>
    </section>
  );
};
