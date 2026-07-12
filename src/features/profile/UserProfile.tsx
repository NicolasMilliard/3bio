import { THREE_BIO_DEFAULT_THEME } from '@/constants';
import { formatToThreeBioMetadata } from '@/helpers';
import { useTheme } from '@/hooks/useTheme';
import type { ThreeBioProfile } from '@/schemas/threeBioMetadata.schema';
import {
  type Account,
  useAccount,
  useAccountStats,
} from '@lens-protocol/react';
import { useRef, type WheelEvent } from 'react';

import { SpinnerScreen } from '@/components/ui';
import {
  Branding,
  Identity,
  Links,
  NotFoundScreen,
  SocialLinks,
  Statistics,
} from './components';

type ProfileStats = {
  graphFollowStats?: {
    followers?: number;
    following?: number;
  };
  feedStats?: {
    posts?: number;
  };
};

export type ProfileDataResult = {
  account: Account | null | undefined;
  stats: ProfileStats | undefined;
  loading: boolean;
  error: unknown;
};

export type UseProfileData = (lensHandle: string) => ProfileDataResult;

const useLensProfileData: UseProfileData = (lensHandle) => {
  const {
    data: account,
    loading,
    error,
  } = useAccount({ username: { localName: lensHandle } });

  const { data: stats } = useAccountStats({
    account: account?.address ?? '',
  });

  return { account, stats, loading, error };
};

const UserProfile = ({
  lensHandle,
  useProfileData = useLensProfileData,
}: {
  lensHandle: string;
  useProfileData?: UseProfileData;
}) => {
  const { account, stats, loading, error } = useProfileData(lensHandle);

  const threeBioMetadata = account
    ? formatToThreeBioMetadata(account)
    : undefined;
  const theme = threeBioMetadata?.theme;
  const themeName = theme?.name ?? THREE_BIO_DEFAULT_THEME;
  const contentPanelRef = useRef<HTMLElement>(null);

  useTheme(themeName);

  const handleDesktopWheel = (event: WheelEvent<HTMLElement>) => {
    const contentPanel = contentPanelRef.current;
    const usesFixedDesktopLayout = window.matchMedia(
      '(min-width: 64rem) and (min-height: 44rem)',
    ).matches;

    if (
      !usesFixedDesktopLayout ||
      !contentPanel ||
      contentPanel.contains(event.target as Node) ||
      event.deltaY === 0
    ) {
      return;
    }

    contentPanel.scrollBy({ top: event.deltaY });
  };

  if (loading) return <SpinnerScreen text="Loading profile..." />;

  if (error || !account) {
    return <NotFoundScreen lensHandle={lensHandle} />;
  }

  const profile: ThreeBioProfile = threeBioMetadata?.profile ?? {};
  const followers = stats?.graphFollowStats?.followers;
  const following = stats?.graphFollowStats?.following;
  const posts = stats?.feedStats?.posts;
  const displayStatistics = theme?.displayStatistics ?? true;
  const displayBranding = theme?.displayBranding ?? true;

  return (
    <main
      className="profile-page bg-background min-h-dvh"
      onWheel={handleDesktopWheel}
    >
      <div className="profile-layout mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,1.15fr)] lg:grid-rows-[1fr_auto] lg:gap-x-12 lg:gap-y-0 lg:px-8 xl:grid-cols-[29.375rem_34.625rem] xl:gap-x-16 xl:px-0">
        <section
          aria-label="Profile summary"
          className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:pt-[clamp(2rem,calc(100dvh-46rem),6rem)]"
        >
          <Identity lensHandle={lensHandle} profile={profile} />
          <SocialLinks socialLinks={profile.socialLinks} />
          {displayStatistics && (
            <Statistics
              followers={followers}
              following={following}
              posts={posts}
            />
          )}
        </section>

        <section
          ref={contentPanelRef}
          aria-label="Profile links"
          className="profile-content-scroll bg-content-background min-h-48 w-full rounded-[2rem] px-5 py-6 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-[clamp(2rem,calc(100dvh-46rem),6rem)] lg:min-h-0 lg:self-stretch lg:overflow-y-auto lg:overscroll-none"
          tabIndex={profile.links?.length ? 0 : undefined}
        >
          <Links links={profile.links} />
        </section>

        {displayBranding && (
          <Branding className="text-center lg:col-start-1 lg:row-start-2 lg:self-end lg:text-left" />
        )}
      </div>
    </main>
  );
};

export default UserProfile;
