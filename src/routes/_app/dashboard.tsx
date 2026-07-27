import { createFileRoute } from '@tanstack/react-router';

import { PrivateRouteDocumentMetadata } from '@/components/layout';
import { AuthGuard } from '@/features/auth/components';
import { DashboardScreen } from '@/features/dashboard/components/DashboardScreen';

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <>
      <PrivateRouteDocumentMetadata title="Dashboard | 3bio" />
      <AuthGuard>
        <DashboardScreen />
      </AuthGuard>
    </>
  );
}
