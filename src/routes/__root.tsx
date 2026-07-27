import { ErrorScreen, Toaster, TooltipProvider } from '@/components/ui';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

const RootErrorScreen = () => (
  <ErrorScreen
    title="Something went wrong."
    description="The page couldn't be loaded. Reload it to try again."
    retryLabel="Reload page"
    onRetry={() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }}
  />
);

const RootLayout = () => (
  <>
    <TooltipProvider>
      <Outlet />
      <Toaster richColors />
    </TooltipProvider>
    <TanStackRouterDevtools position="bottom-right" />
  </>
);

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorScreen,
});
