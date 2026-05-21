import { formatToInBioMetadata } from '@/helpers';
import type { Account, AccountStats } from '@lens-protocol/react';

import { SidebarTrigger } from '@/components/ui';
import {
  BrandingSection,
  CoverPictureSection,
  EditorForm,
  EditorProfilePreview,
  IdentitySection,
  LinksSection,
  SidebarEditor,
  SocialLinksSection,
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

              <EditorProfilePreview
                defaultTheme={inBioMetadata?.theme?.name ?? 'light'}
              >
                <IdentitySection
                  lensHandle={account.username?.localName ?? ''}
                  profile={inBioMetadata?.profile}
                />
                <StatisticsSection {...statsData} />
                <SocialLinksSection />
                <LinksSection />
                <BrandingSection />
              </EditorProfilePreview>
            </div>
          </main>
        </div>
      </EditorForm>
    </EditorProvider>
  );
};
