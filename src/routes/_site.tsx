import { AppShell } from '@/components/layout';
import { createFileRoute, Outlet } from '@tanstack/react-router';

const SiteLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

export const Route = createFileRoute('/_site')({
  component: SiteLayout,
});
