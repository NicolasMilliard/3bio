import { chains } from '@lens-chain/sdk/viem';
import type { SessionClient } from '@lens-protocol/client';
import { setAccountMetadata } from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';
import { uri } from '@lens-protocol/react';
import {
  getConnection,
  getWalletClient,
  switchChain,
  type Config,
} from '@wagmi/core';

import {
  resolveAccountSessionBinding,
  type AccountSessionBindingState,
} from '@/features/auth/sessionBinding';
import { getTransactionFailureReason } from '../helpers/getTransactionFailureReason';
import type { EditorSessionSnapshot } from './getEditorSessionSnapshot';

export type MetadataUpdateProgress =
  | 'switching-network'
  | 'confirming-transaction';

export type MetadataUpdateFailure =
  | {
      kind: 'session';
      state: AccountSessionBindingState;
    }
  | {
      kind: 'session-changed';
    }
  | {
      kind: 'network-required';
      description: string;
    }
  | {
      kind: 'transaction-failed';
      description: string;
    }
  | {
      kind: 'confirmation-failed';
      error: unknown;
    };

export type MetadataUpdateResult =
  | {
      ok: true;
      sessionClient: SessionClient;
    }
  | {
      ok: false;
      failure: MetadataUpdateFailure;
    };

type SubmitMetadataUpdateInput = {
  config: Config;
  accountAddress: string;
  metadataUri: string;
  getCurrentEditorSession: () => EditorSessionSnapshot;
  onProgress?: (progress: MetadataUpdateProgress) => void;
  dependencies?: SubmitMetadataUpdateDependencies;
};

const handleMetadataOperation = (
  walletClient: Parameters<typeof handleOperationWith>[0],
  operation: Parameters<ReturnType<typeof handleOperationWith>>[0],
) => handleOperationWith(walletClient)(operation);

type SubmitMetadataUpdateDependencies = {
  getConnection: typeof getConnection;
  getWalletClient: typeof getWalletClient;
  handleOperation: typeof handleMetadataOperation;
  setAccountMetadata: typeof setAccountMetadata;
  switchChain: typeof switchChain;
};

const defaultDependencies: SubmitMetadataUpdateDependencies = {
  getConnection,
  getWalletClient,
  handleOperation: handleMetadataOperation,
  setAccountMetadata,
  switchChain,
};

export const submitMetadataUpdate = async ({
  config,
  accountAddress,
  metadataUri,
  getCurrentEditorSession,
  onProgress,
  dependencies = defaultDependencies,
}: SubmitMetadataUpdateInput): Promise<MetadataUpdateResult> => {
  const transactionSession = getCurrentEditorSession();

  if (
    !transactionSession.sessionClient ||
    !transactionSession.authenticatedUser
  ) {
    return {
      ok: false,
      failure: { kind: 'session', state: transactionSession.state },
    };
  }

  const operation = await dependencies.setAccountMetadata(
    transactionSession.sessionClient,
    {
      metadataUri: uri(metadataUri),
    },
  );

  if (operation.isErr()) {
    return {
      ok: false,
      failure: {
        kind: 'transaction-failed',
        description: operation.error.message ?? 'An error occurred.',
      },
    };
  }

  const operationResult = operation.value;
  const failureReason = getTransactionFailureReason(operationResult);

  if (failureReason !== null) {
    return {
      ok: false,
      failure: {
        kind: 'transaction-failed',
        description: failureReason,
      },
    };
  }

  let transactionHash =
    'hash' in operationResult ? operationResult.hash : undefined;

  if (!('hash' in operationResult)) {
    const signingConnection = dependencies.getConnection(config);

    if (signingConnection.status !== 'connected') {
      return {
        ok: false,
        failure: {
          kind: 'session',
          state: resolveAccountSessionBinding({
            walletStatus: signingConnection.status,
            walletAddress: signingConnection.address,
            lensLoading: false,
            session: transactionSession.authenticatedUser,
            accountAddress,
          }),
        },
      };
    }

    if (signingConnection.chainId !== chains.mainnet.id) {
      onProgress?.('switching-network');

      try {
        await dependencies.switchChain(config, {
          chainId: chains.mainnet.id,
          connector: signingConnection.connector,
        });
      } catch {
        return {
          ok: false,
          failure: {
            kind: 'network-required',
            description:
              'Switch your wallet to the Lens network to complete this save.',
          },
        };
      }
    }

    const signingSession = getCurrentEditorSession();

    if (
      !signingSession.sessionClient ||
      !signingSession.authenticatedUser ||
      signingSession.connection.status !== 'connected'
    ) {
      return {
        ok: false,
        failure: { kind: 'session', state: signingSession.state },
      };
    }

    if (
      signingSession.authenticatedUser.authenticationId !==
      transactionSession.authenticatedUser.authenticationId
    ) {
      return { ok: false, failure: { kind: 'session-changed' } };
    }

    const walletClient = await dependencies.getWalletClient(config, {
      account: signingSession.connection.address,
      assertChainId: true,
      chainId: chains.mainnet.id,
      connector: signingSession.connection.connector,
    });

    const finalSession = getCurrentEditorSession();

    if (
      !finalSession.sessionClient ||
      !finalSession.authenticatedUser ||
      finalSession.connection.status !== 'connected'
    ) {
      return {
        ok: false,
        failure: { kind: 'session', state: finalSession.state },
      };
    }

    if (
      finalSession.authenticatedUser.authenticationId !==
      transactionSession.authenticatedUser.authenticationId
    ) {
      return { ok: false, failure: { kind: 'session-changed' } };
    }

    if (finalSession.connection.chainId !== chains.mainnet.id) {
      return {
        ok: false,
        failure: {
          kind: 'network-required',
          description:
            'Switch your wallet back to the Lens network and try again.',
        },
      };
    }

    const result = await dependencies.handleOperation(
      walletClient,
      operationResult,
    );

    if (result.isErr()) {
      return {
        ok: false,
        failure: {
          kind: 'transaction-failed',
          description: result.error.message ?? 'An error occurred.',
        },
      };
    }

    transactionHash = result.value;
  }

  if (!transactionHash) {
    return {
      ok: false,
      failure: {
        kind: 'transaction-failed',
        description: 'The wallet did not return a transaction hash.',
      },
    };
  }

  onProgress?.('confirming-transaction');

  const confirmation =
    await transactionSession.sessionClient.waitForTransaction(transactionHash);

  if (confirmation.isErr()) {
    return {
      ok: false,
      failure: {
        kind: 'confirmation-failed',
        error: confirmation.error,
      },
    };
  }

  return {
    ok: true,
    sessionClient: transactionSession.sessionClient,
  };
};
