import { getThreeBioProfile } from '@/helpers';
import type { ThreeBioProfile } from '@/schemas/threeBioMetadata.schema';
import {
  useAccountsAvailable,
  type AccountAvailable,
} from '@lens-protocol/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useConnection } from 'wagmi';
import { useDisconnectWallet, useLensLogin } from '../hooks';
import { ProfileCard } from './ProfileCard';

import { Button, Spinner, Text } from '@/components/ui';

type ProfileSelectionScreenProps = {
  notice?: string;
};

type ProfileSelectionQueryProps = ProfileSelectionScreenProps & {
  onRetry: () => void;
};

const ProfileSelectionQuery = ({
  notice,
  onRetry,
}: ProfileSelectionQueryProps) => {
  const connection = useConnection();
  const {
    data: accounts,
    loading,
    error,
  } = useAccountsAvailable({
    managedBy: connection.address,
  });
  const loginWithLens = useLensLogin();
  const { disconnectWallet, isDisconnecting } = useDisconnectWallet();
  const loginInFlight = useRef(false);
  const [selectedProfileAddress, setSelectedProfileAddress] = useState<
    string | null
  >(null);

  const handleSelect = async (item: AccountAvailable) => {
    if (loginInFlight.current) return;

    loginInFlight.current = true;
    setSelectedProfileAddress(item.account.address);

    try {
      const outcome = await loginWithLens(item);

      if (!outcome.success) {
        toast.error('Could not select profile', {
          description: outcome.message,
        });
      }
    } finally {
      loginInFlight.current = false;
      setSelectedProfileAddress(null);
    }
  };

  return (
    <section className="mt-30 flex flex-col items-center gap-8 px-4 text-center">
      <div className="space-y-2">
        <Text variant="h1">Choose your profile</Text>
        <Text className="max-w-97">
          Select the profile you want to use. You can switch later from your
          dashboard.
        </Text>
        {notice ? <Text className="text-destructive">{notice}</Text> : null}
      </div>

      {loading && (
        <section
          role="status"
          aria-live="polite"
          className="mt-30 flex items-center justify-center gap-4"
        >
          <Spinner aria-hidden="true" />
          <Text>Loading your profiles...</Text>
        </section>
      )}

      {!loading && error && (
        <div
          className="border-destructive/30 bg-destructive/5 flex max-w-md flex-col items-center gap-4 rounded-3xl border p-6"
          role="alert"
        >
          <div className="space-y-1">
            <Text className="font-semibold">
              We couldn&apos;t load your profiles
            </Text>
            <Text className="text-muted-foreground text-sm">
              Check your connection and try again. Your wallet is still
              connected.
            </Text>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={onRetry}>
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isDisconnecting}
              onClick={() => void disconnectWallet()}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Try another wallet'}
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && !accounts?.items.length && (
        <div className="flex max-w-md flex-col items-center gap-4">
          <div className="space-y-1">
            <Text className="font-semibold">
              No Lens profiles found for this wallet
            </Text>
            <Text className="text-muted-foreground text-sm">
              Connect a wallet that owns or manages a Lens profile.
            </Text>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isDisconnecting}
            onClick={() => void disconnectWallet()}
          >
            {isDisconnecting ? 'Disconnecting...' : 'Try another wallet'}
          </Button>
        </div>
      )}

      {!loading && !error && accounts?.items.length ? (
        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.items.map((item) => {
            const threeBioProfile: ThreeBioProfile | undefined =
              getThreeBioProfile(item.account.metadata?.attributes);
            const name =
              threeBioProfile?.name ??
              item.account.username?.localName ??
              'Unnamed';
            const avatar =
              threeBioProfile?.avatar ?? item.account.metadata?.picture;
            const coverPicture =
              threeBioProfile?.coverPicture ??
              item.account.metadata?.coverPicture;
            const avatarFallback =
              item.account.username?.localName?.[0]?.toUpperCase() ??
              name[0]?.toUpperCase() ??
              'U';
            const isLoading = selectedProfileAddress === item.account.address;

            return (
              <ProfileCard
                key={item.account.address}
                address={item.account.address}
                avatar={avatar}
                avatarFallback={avatarFallback}
                coverPicture={coverPicture}
                disabled={selectedProfileAddress !== null}
                isLoading={isLoading}
                name={name}
                onSelect={() => void handleSelect(item)}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export const ProfileSelectionScreen = ({
  notice,
}: ProfileSelectionScreenProps) => {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <ProfileSelectionQuery
      key={retryKey}
      notice={notice}
      onRetry={() => setRetryKey((key) => key + 1)}
    />
  );
};
