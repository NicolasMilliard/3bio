import { Toaster, TooltipProvider } from '@/components/ui';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

const RootLayout = () => (
  <>
    <TooltipProvider>
      <Outlet />
      <Toaster richColors />
    </TooltipProvider>
    <TanStackRouterDevtools position="bottom-right" />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
