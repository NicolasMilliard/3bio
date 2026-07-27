import { useEditorAccount } from '@/features/editor/hooks';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import {
  Button,
  ErrorScreen,
  SidebarProvider,
  SpinnerScreen,
} from '@/components/ui';
import { AuthGuard } from '@/features/auth/components';
import { EditorScreen } from '@/features/editor/components/EditorScreen';
import { NotFoundScreen } from '@/features/profile/components';

export const Route = createFileRoute('/edit/')({
  component: EditorPage,
});

function EditorPage() {
  const [requestKey, setRequestKey] = useState(0);

  return (
    <AuthGuard>
      <EditorContent
        key={requestKey}
        onRetry={() => setRequestKey((key) => key + 1)}
      />
    </AuthGuard>
  );
}

function EditorContent({ onRetry }: { onRetry: () => void }) {
  const { account, stats, loading, error } = useEditorAccount();

  if (loading) return <SpinnerScreen text="Loading profile..." />;

  if (error) {
    return (
      <ErrorScreen
        title="We couldn't load your profile."
        description="There was a problem connecting to Lens. Check your connection and try again."
        onRetry={onRetry}
      >
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </ErrorScreen>
    );
  }

  if (!account) {
    return <NotFoundScreen />;
  }

  return (
    <SidebarProvider>
      <EditorScreen account={account} stats={stats} />
    </SidebarProvider>
  );
}
