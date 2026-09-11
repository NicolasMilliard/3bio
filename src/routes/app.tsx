import { useWalletAnalytics } from '@/features/analytics/useWalletAnalytics';
import { isInternalAppPath } from '@/features/profile/edge/routing';
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';

export const Route = createFileRoute('/app')({
  component: AppRoute,
});

function AppRoute() {
  const pathname = useLocation({ select: (location) => location.pathname });
  useWalletAnalytics(isInternalAppPath(pathname));

  return <Outlet />;
}
