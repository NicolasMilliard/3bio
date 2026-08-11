import { formatToThreeBioMetadata } from '@/helpers';
import type { Account, AccountStats } from '@lens-protocol/react';

import { SidebarTrigger, useSidebar } from '@/components/ui';
import {
  EditorForm,
  EditorProfilePreview,
  SidebarEditor,
} from '@/features/editor/components';

export const EditorScreen = ({
  account,
  stats,
}: {
  account: Account;
  stats?: AccountStats;
}) => {
  const { openMobile } = useSidebar();
  const threeBioMetadata = formatToThreeBioMetadata(account);
  const statsData = {
    followers: stats?.graphFollowStats?.followers,
    following: stats?.graphFollowStats?.following,
    posts: stats?.feedStats?.posts,
  };

  return (
    <EditorForm account={account} threeBioMetadata={threeBioMetadata}>
      <div className="flex h-dvh w-dvw overflow-hidden">
        <SidebarEditor />
        <main className="flex min-w-0 flex-1 overflow-y-auto">
          {!openMobile && (
            <SidebarTrigger
              type="button"
              className="bg-card/90 fixed top-4 left-4 z-30 shadow-sm backdrop-blur md:hidden"
            />
          )}
          <EditorProfilePreview
            lensHandle={account.username?.localName ?? ''}
            statistics={statsData}
          />
        </main>
      </div>
    </EditorForm>
  );
};
