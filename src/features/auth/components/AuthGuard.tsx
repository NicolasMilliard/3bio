import { useSessionBinding } from '@/features/auth/hooks';
import { useSessionReconciliation } from '@/providers/authSessionContext';
import type { ComponentType, ReactNode } from 'react';

import { SpinnerScreen } from '@/components/ui';
import { AuthScreen } from './AuthScreen';
import { ProfileSelectionScreen } from './ProfileSelectionScreen';

export const AuthGuard = ({
  children,
  fallbackLayout: FallbackLayout,
}: {
  children: ReactNode;
  fallbackLayout?: ComponentType<{ children: ReactNode }>;
}) => {
  const { state } = useSessionBinding();
  const reconciliationState = useSessionReconciliation();
  const renderFallback = (content: ReactNode) =>
    FallbackLayout ? <FallbackLayout>{content}</FallbackLayout> : content;

  if (state === 'pending') {
    return renderFallback(<SpinnerScreen text="Restoring your session..." />);
  }

  if (state === 'wallet-disconnected') {
    return renderFallback(<AuthScreen />);
  }

  if (state === 'session-missing') {
    return renderFallback(<ProfileSelectionScreen />);
  }

  if (state === 'mismatch') {
    if (reconciliationState === 'failed') {
      return renderFallback(
        <ProfileSelectionScreen notice="Your wallet changed. Choose a Lens profile managed by the connected wallet." />,
      );
    }

    return renderFallback(
      <SpinnerScreen text="Updating your wallet session..." />,
    );
  }

  return <>{children}</>;
};
