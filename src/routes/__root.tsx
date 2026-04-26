import { Toaster, TooltipProvider } from '@/components/ui';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { AppHeader } from '@/components/layout';

const RootLayout = () => (
  <>
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
