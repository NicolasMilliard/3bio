import { AppHeader, Footer } from '@/components/layout';
import { createFileRoute, Outlet } from '@tanstack/react-router';

const AppLayout = () => (
  <div className="flex min-h-dvh flex-col">
    <a
      href="#main-content"
      className="bg-background text-foreground focus:ring-primary sr-only fixed top-4 left-4 z-60 rounded-lg px-4 py-2 font-medium focus:not-sr-only focus:fixed! focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      Skip to main content
    </a>
    <AppHeader />
    <main
      id="main-content"
      tabIndex={-1}
      className="-mt-20 flex flex-1 flex-col gap-30"
    >
      <Outlet />
    </main>
    <Footer />
  </div>
);

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});
