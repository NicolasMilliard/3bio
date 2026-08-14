import type { AuthenticatedUser, SessionClient } from '@lens-protocol/client';
import {
  getConnection,
  type Config,
  type GetConnectionReturnType,
} from '@wagmi/core';

import {
  resolveAccountSessionBinding,
  type AccountSessionBindingState,
} from '@/features/auth/sessionBinding';
import { client } from '@/lib/client';

export type EditorSessionSnapshot = {
  authenticatedUser: AuthenticatedUser | null;
  connection: GetConnectionReturnType;
  sessionClient: SessionClient | null;
  state: AccountSessionBindingState;
};

export const getEditorSessionSnapshot = (
  config: Config,
  accountAddress: string,
): EditorSessionSnapshot => {
  const connection = getConnection(config);
  const currentSession = client.currentSession;
  const authenticatedUser = currentSession.isSessionClient()
    ? currentSession.getAuthenticatedUser().unwrapOr(null)
    : null;
  const state = resolveAccountSessionBinding({
    walletStatus: connection.status,
    walletAddress: connection.address,
    lensLoading: false,
    session: authenticatedUser,
    accountAddress,
  });

  return {
    authenticatedUser,
    connection,
    sessionClient:
      state === 'bound' && currentSession.isSessionClient()
        ? currentSession
        : null,
    state,
  };
};
