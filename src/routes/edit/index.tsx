import { formatLensProfile } from '@/helpers';
import {
  useAccount,
  useAccountStats,
  useAuthenticatedUser,
} from '@lens-protocol/react';
import { createFileRoute } from '@tanstack/react-router';

import { SpinnerScreen } from '@/components/ui';
import { AuthGuard } from '@/features/auth/components';
import { EditProfileForm } from '@/features/editProfile/components';
import {
  Banner,
  Branding,
  NotFoundScreen,
  ProfileEditorPanel,
  Statistics,
  WebsiteLink,
} from '@/features/profile/components';

export const Route = createFileRoute('/edit/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: authenticatedUser } = useAuthenticatedUser();
  const {
    data: account,
    loading,
    error,
  } = useAccount({
    address: authenticatedUser?.address ?? '',
  });
  const { data: stats } = useAccountStats({
    account: account?.address ?? '',
  });

  if (loading) return <SpinnerScreen text="Loading profile..." />;

  if (error || !account) {
    return <NotFoundScreen />;
  }

  const profile = formatLensProfile(account);
  const followers = stats?.graphFollowStats?.followers;
  const following = stats?.graphFollowStats?.following;
  const posts = stats?.feedStats?.posts;

  const website = profile.website
    ? {
        href: profile.website,
        label: profile.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      }
    : null;

  return (
    <AuthGuard>
      <div className="flex">
        <ProfileEditorPanel />
        <div className="flex flex-1 items-center justify-center overflow-hidden">
          <Banner banner={profile.banner} />
          <section className="sm:bg-card/55 sm:border-secondary relative z-2 flex w-full animate-[riseIn_0.5s_cubic-bezier(0.22,1,0.36,1)_both] flex-col items-center gap-6 px-6 pt-12 pb-10 sm:my-8 sm:min-h-0 sm:w-105 sm:rounded-3xl sm:border sm:px-8 sm:pt-10 sm:pb-8 sm:shadow-[0_8px_48px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] sm:backdrop-blur-xl sm:backdrop-saturate-180">
            <EditProfileForm profile={profile} />
            <Statistics
              followers={followers}
              following={following}
              posts={posts}
            />

            {website && (
              <WebsiteLink href={website.href} label={website.label} />
            )}
            <Branding />
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
