import { AppShell } from '@/components/layout';
import { createFileRoute, Outlet } from '@tanstack/react-router';

const AppLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});
