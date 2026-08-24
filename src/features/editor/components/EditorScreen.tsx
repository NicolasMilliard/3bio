import { formatToThreeBioMetadata } from '@/helpers';
import type { Account, AccountStats } from '@lens-protocol/react';

import { SidebarTrigger, useSidebar } from '@/components/ui';
import {
  EditorForm,
  EditorProfilePreview,
  SidebarEditor,
} from '@/features/editor/components';
import { DeletedProfileEditorScreen } from './DeletedProfileEditorScreen';

const ActiveEditorScreen = ({
  account,
  stats,
  threeBioMetadata,
}: {
  account: Account;
  stats?: AccountStats;
  threeBioMetadata: ReturnType<typeof formatToThreeBioMetadata>;
}) => {
  const { openMobile } = useSidebar();
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

export const EditorScreen = ({
  account,
  stats,
}: {
  account: Account;
  stats?: AccountStats;
}) => {
  const threeBioMetadata = formatToThreeBioMetadata(account);

  if (threeBioMetadata.publication?.status === 'deleted') {
    return <DeletedProfileEditorScreen />;
  }

  return (
    <ActiveEditorScreen
      account={account}
      stats={stats}
      threeBioMetadata={threeBioMetadata}
    />
  );
};
