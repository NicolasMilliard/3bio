import { createFileRoute } from '@tanstack/react-router';

import {
  AppShell,
  PrivateRouteDocumentMetadata,
} from '@/components/layout';
import { AuthGuard } from '@/features/auth/components';
import { DashboardScreen } from '@/features/dashboard/components/DashboardScreen';

export const Route = createFileRoute('/app/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <PrivateRouteDocumentMetadata title="Dashboard | 3bio" />
      <AuthGuard>
        <DashboardScreen />
      </AuthGuard>
    </AppShell>
  );
}
