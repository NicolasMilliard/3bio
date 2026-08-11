import { Button, ErrorScreen, Toaster, TooltipProvider } from '@/components/ui';
import {
  NOINDEX_ROBOTS,
  PAGE_NOT_FOUND_DESCRIPTION,
  PAGE_NOT_FOUND_TITLE,
} from '@/features/profile/documentMetadata';
import { useClearServerMetadata } from '@/hooks/useClearServerMetadata';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
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

const RootNotFoundScreen = () => {
  useClearServerMetadata();
  useDocumentTitle(PAGE_NOT_FOUND_TITLE);

  return (
    <>
      <title>{PAGE_NOT_FOUND_TITLE}</title>
      <meta name="description" content={PAGE_NOT_FOUND_DESCRIPTION} />
      <meta name="robots" content={NOINDEX_ROBOTS} />
      <ErrorScreen
        title="Page not found."
        description={PAGE_NOT_FOUND_DESCRIPTION}
      >
        <Button asChild variant="outline">
          <Link to="/">Go back home</Link>
        </Button>
      </ErrorScreen>
    </>
  );
};

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
  notFoundComponent: RootNotFoundScreen,
});
