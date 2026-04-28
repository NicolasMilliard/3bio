import { AppHeader } from '@/components/layout';
import { createFileRoute, Outlet } from '@tanstack/react-router';

const AppLayout = () => (
  <div className="flex min-h-dvh flex-col">
    <AppHeader />

    <main className="mx-auto flex w-full flex-1 flex-col">
      <Outlet />
    </main>
  </div>
);

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});
