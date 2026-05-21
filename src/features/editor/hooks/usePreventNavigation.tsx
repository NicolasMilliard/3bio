import { useBlocker } from '@tanstack/react-router';
import { useEffect } from 'react';

export const usePreventNavigation = ({
  enabled,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: {
  enabled: boolean;
  message?: string;
}) => {
  // Prevent TanStack Router navigation
  const blocker = useBlocker({
    shouldBlockFn: () => enabled,
    withResolver: true,
  });

  // Prevent browser navigation
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();

      // For modern browsers, setting returnValue is not necessary,
      // but it is required for some older browsers
      event.returnValue = message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, message]);

  const confirmNavigation = () => {
    blocker.proceed?.();
  };

  const cancelNavigation = () => {
    blocker.reset?.();
  };

  return {
    open: blocker.status === 'blocked',
    confirmNavigation,
    cancelNavigation,
  };
};
