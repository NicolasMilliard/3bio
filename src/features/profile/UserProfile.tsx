import { formatToInBioMetadata } from '@/helpers';
import { cn } from '@/lib/utils';
import { useAccount, useAccountStats } from '@lens-protocol/react';
import { useEffect } from 'react';

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

  const themeName =
    (account && formatToInBioMetadata(account)?.theme?.name) ?? 'default';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
  }, [themeName]);

  if (loading) return <SpinnerScreen text="Loading profile..." />;

  if (error || !account) {
    return <NotFoundScreen lensHandle={lensHandle} />;
  }

  const profile = formatToInBioMetadata(account)?.profile;
  const followers = stats?.graphFollowStats?.followers;
  const following = stats?.graphFollowStats?.following;
  const posts = stats?.feedStats?.posts;

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center">
      <CoverPicture coverPicture={profile.coverPicture} />
      <section
        className={cn(
          'relative z-2 mx-4 flex w-full flex-col items-center gap-6 px-6 pt-12 pb-10',
          // Card
          'bg-card/55 border-border my-8 min-h-0 w-full max-w-105 rounded-3xl border px-8 pt-10 pb-8 shadow-[0_8px_48px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-180',
          'animate-[blurFadeIn_0.4s_ease-out_forwards]',
        )}
      >
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
