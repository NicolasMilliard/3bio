import { formatToInBioMetadata } from '@/helpers';
import type { Account, AccountStats } from '@lens-protocol/react';

import { SidebarTrigger } from '@/components/ui';
import {
  BrandingSection,
  CoverPictureSection,
  EditorForm,
  IdentitySection,
  LinksSection,
  SidebarEditor,
  SocialIconsSection,
  StatisticsSection,
} from '@/features/editor/components';
import { EditorProvider } from '../context/editor.context';

export const EditorScreen = ({
  account,
  stats,
}: {
  account: Account;
  stats?: AccountStats;
}) => {
  const inBioMetadata = formatToInBioMetadata(account);
  const inBioProfile = inBioMetadata.profile;
  const statsData = {
    followers: stats?.graphFollowStats?.followers,
    following: stats?.graphFollowStats?.following,
    posts: stats?.feedStats?.posts,
  };

  return (
    <EditorProvider value={{ account, stats, inBioMetadata }}>
      <EditorForm>
        <div className="flex h-dvh w-dvw">
          <SidebarEditor />
          <main className="mx-auto flex w-full flex-1 flex-col">
            <SidebarTrigger
              type="button"
              className="bg-card fixed top-5 z-10 ml-2"
            />
            <div className="flex w-full flex-1 items-center justify-center">
              <CoverPictureSection />

              <section className="sm:bg-card/55 sm:border-secondary relative z-2 flex w-full animate-[riseIn_0.5s_cubic-bezier(0.22,1,0.36,1)_both] flex-col items-center gap-6 px-6 pt-12 pb-10 sm:my-8 sm:min-h-0 sm:w-105 sm:rounded-3xl sm:border sm:px-8 sm:pt-10 sm:pb-8 sm:shadow-[0_8px_48px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] sm:backdrop-blur-xl sm:backdrop-saturate-180">
                <IdentitySection
                  lensHandle={account.username?.localName}
                  profile={inBioProfile}
                />
                <SocialIconsSection />
                <LinksSection />
                <StatisticsSection {...statsData} />
                <BrandingSection />
              </section>
            </div>
          </main>
        </div>
      </EditorForm>
    </EditorProvider>
  );
};
