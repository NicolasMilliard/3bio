import { formatToInBioMetadata } from '@/helpers';
import { useAccount, useAccountStats } from '@lens-protocol/react';

import { SpinnerScreen } from '@/components/ui';
import {
  Branding,
  CoverPicture,
  Identity,
  LinksSection,
  NotFoundScreen,
  SocialLinks,
  Statistics,
} from './components';

const UserProfile = ({ lensHandle }: { lensHandle: string }) => {
  const {
    data: account,
    loading,
    error,
  } = useAccount({ username: { localName: lensHandle } });

  const { data: stats } = useAccountStats({
    account: account?.address ?? '',
  });

  if (loading) return <SpinnerScreen text="Loading profile..." />;

  if (error || !account) {
    return <NotFoundScreen lensHandle={lensHandle} />;
  }

  const profile = formatToInBioMetadata(account)?.profile;
  const followers = stats?.graphFollowStats?.followers;
  const following = stats?.graphFollowStats?.following;
  const posts = stats?.feedStats?.posts;

  return (
    <main
      data-theme={'default'}
      className="flex min-h-dvh flex-1 items-center justify-center"
    >
      <CoverPicture coverPicture={profile.coverPicture} />
      <section className="sm:bg-card/55 sm:border-secondary relative z-2 flex w-full animate-[riseIn_0.5s_cubic-bezier(0.22,1,0.36,1)_both] flex-col items-center gap-6 px-6 pt-12 pb-10 sm:my-8 sm:min-h-0 sm:w-105 sm:rounded-3xl sm:border sm:px-8 sm:pt-10 sm:pb-8 sm:shadow-[0_8px_48px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] sm:backdrop-blur-xl sm:backdrop-saturate-180">
        <Identity lensHandle={lensHandle} profile={profile} />
        <Statistics followers={followers} following={following} posts={posts} />
        <SocialLinks socialLinks={profile.socialLinks} />
        <LinksSection links={profile.links} />
        <Branding />
      </section>
    </main>
  );
};

export default UserProfile;
