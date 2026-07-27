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
  const { proceed, reset, status } = blocker;

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

  useEffect(() => {
    if (!enabled && status === 'blocked') {
      proceed?.();
    }
  }, [enabled, proceed, status]);

  const confirmNavigation = () => {
    proceed?.();
  };

  const cancelNavigation = () => {
    reset?.();
  };

  return {
    open: status === 'blocked',
    confirmNavigation,
    cancelNavigation,
  };
};
