import { THREE_BIO_DEFAULT_THEME } from '@/constants';
import { formatToThreeBioMetadata } from '@/helpers';
import { useTheme } from '@/hooks/useTheme';
import type { ThreeBioProfile } from '@/schemas/threeBioMetadata.schema';
import { useAccount, useAccountStats } from '@lens-protocol/react';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { Button, ErrorScreen, SpinnerScreen } from '@/components/ui';
import {
  NotFoundScreen,
  ProfileDocumentMetadata,
  ProfileLayout,
} from './components';
import {
  getProfilePublicationDecision,
  readProfilePublicationState,
} from './publication';

const UserProfile = ({ lensHandle }: { lensHandle: string }) => {
  const [requestKey, setRequestKey] = useState(0);

  return (
    <UserProfileContent
      key={requestKey}
      lensHandle={lensHandle}
      onRetry={() => setRequestKey((key) => key + 1)}
    />
  );
};

const UserProfileContent = ({
  lensHandle,
  onRetry,
}: {
  lensHandle: string;
  onRetry: () => void;
}) => {
  const {
    data: account,
    loading,
    error,
  } = useAccount({ username: { localName: lensHandle } });

  const publicationState = account
    ? readProfilePublicationState(account.metadata?.attributes)
    : undefined;
  const publicationDecision = account
    ? getProfilePublicationDecision({
        accountAddress: account.address,
        hasUnsupportedSchemaVersion:
          publicationState?.hasUnsupportedSchemaVersion,
        lensHandle: account.username?.localName ?? lensHandle,
        publicationStatus: publicationState?.status,
      })
    : undefined;
  const isPublic = publicationDecision?.isPublic === true;
  const { data: stats } = useAccountStats({
    account: isPublic && account ? account.address : '',
  });
  const threeBioMetadata =
    isPublic && account ? formatToThreeBioMetadata(account) : undefined;
  const isUnavailable = !isPublic;
  const theme = threeBioMetadata?.theme;
  const themeName = theme?.name ?? THREE_BIO_DEFAULT_THEME;
  const profile: ThreeBioProfile = threeBioMetadata?.profile ?? {};
  const followers = stats?.graphFollowStats?.followers;
  const following = stats?.graphFollowStats?.following;
  const posts = stats?.feedStats?.posts;
  const displayStatistics = theme?.displayStatistics ?? true;
  const displayBranding = theme?.displayBranding ?? true;

  useTheme(themeName);

  return (
    <>
      <ProfileDocumentMetadata
        lensHandle={lensHandle}
        profile={profile}
        followers={followers}
        following={following}
        posts={posts}
        displayStatistics={displayStatistics}
        status={
          loading
            ? 'loading'
            : error
              ? 'error'
              : isUnavailable
                ? 'not-found'
                : 'ready'
        }
      />

      {loading ? (
        <SpinnerScreen as="main" text="Loading profile..." />
      ) : error ? (
        <ErrorScreen
          title="We couldn't load this profile."
          description="There was a problem connecting to Lens. Check your connection and try again."
          onRetry={onRetry}
        >
          <Button asChild variant="outline">
            <Link to="/">Go back home</Link>
          </Button>
        </ErrorScreen>
      ) : isUnavailable ? (
        <NotFoundScreen lensHandle={lensHandle} />
      ) : (
        <ProfileLayout
          as="main"
          lensHandle={lensHandle}
          profile={profile}
          statistics={{ followers, following, posts }}
          themeName={themeName}
          displayStatistics={displayStatistics}
          displayBranding={displayBranding}
        />
      )}
    </>
  );
};

export default UserProfile;
