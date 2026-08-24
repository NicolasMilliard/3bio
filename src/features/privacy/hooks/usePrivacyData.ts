import { chains } from '@lens-chain/sdk/viem';
import { lensAccountOnly, type Signer } from '@lens-chain/storage-client';
import { fetchAccount } from '@lens-protocol/client/actions';
import type { Account } from '@lens-protocol/react';
import { getWalletClient } from '@wagmi/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useConfig } from 'wagmi';

import {
  getMetadataPreparationFailureFeedback,
  getMetadataUpdateFailureFeedback,
  getSessionErrorFeedback,
} from '@/features/editor/helpers/editorSaveFeedback';
import { isDefinitiveMetadataUpdateFailure } from '@/features/editor/helpers/editorGroveLifecycle';
import {
  markGrovePublicationConfirmed,
  markManagedGroveResourcesOrphaned,
  readGroveManagedResourceManifest,
  recordManagedGroveResources,
  selectDeletableManagedGroveResources,
  type GroveManagedResourceRecord,
} from '@/features/editor/services/groveManagedResourceManifest';
import { getEditorSessionSnapshot } from '@/features/editor/services/getEditorSessionSnapshot';
import { submitMetadataUpdate } from '@/features/editor/services/submitMetadataUpdate';
import { withGroveAccountLock } from '@/features/editor/services/withGroveAccountLock';
import { readProfilePublicationState } from '@/features/profile/publication';
import { formatToThreeBioMetadata } from '@/helpers';
import type { ThreeBioPublicationStatus } from '@/schemas/threeBioMetadata.schema';
import type { PrivacyDataAction } from '../components';
import {
  cleanupManagedGroveResources,
  prepareProfilePublicationUpdate,
} from '../services';

const showError = (feedback: { title: string; description: string }) => {
  toast.error(feedback.title, { description: feedback.description });
};

const getInitialPublicationStatus = (
  account: Account,
): ThreeBioPublicationStatus =>
  formatToThreeBioMetadata(account).publication?.status ?? 'public';

const isExpectedAccount = (candidate: Account, accountAddress: string) =>
  candidate.address.toLowerCase() === accountAddress.toLowerCase();

type BoundSessionClient = NonNullable<
  ReturnType<typeof getEditorSessionSnapshot>['sessionClient']
>;

export const usePrivacyData = (account: Account) => {
  const config = useConfig();
  const actionInFlight = useRef(false);
  const [publicationStatus, setPublicationStatus] =
    useState<ThreeBioPublicationStatus>(() =>
      getInitialPublicationStatus(account),
    );
  const [busyAction, setBusyAction] = useState<PrivacyDataAction | null>(null);
  const [cleanupAvailable, setCleanupAvailable] = useState(true);
  const [managedResourceCount, setManagedResourceCount] = useState(0);
  const acl = lensAccountOnly(account.address, chains.mainnet.id);
  const getCurrentSession = useCallback(
    () => getEditorSessionSnapshot(config, account.address),
    [account.address, config],
  );

  const refreshManagedResourceCount = useCallback(() => {
    const manifest = readGroveManagedResourceManifest({
      accountAddress: account.address,
    });

    setCleanupAvailable(manifest.ok);
    setManagedResourceCount(
      manifest.ok
        ? selectDeletableManagedGroveResources({
            manifest: manifest.manifest,
          }).length
        : 0,
    );
  }, [account.address]);

  useEffect(() => {
    setPublicationStatus(getInitialPublicationStatus(account));
    refreshManagedResourceCount();
  }, [account, refreshManagedResourceCount]);

  const getBoundWalletSigner = useCallback(async (): Promise<{
    sessionClient: BoundSessionClient;
    signer: Signer;
  } | null> => {
    const session = getCurrentSession();

    if (!session.sessionClient || session.connection.status !== 'connected') {
      showError(getSessionErrorFeedback(session.state));
      return null;
    }

    const walletClient = await getWalletClient(config, {
      account: session.connection.address,
      connector: session.connection.connector,
    });

    return {
      sessionClient: session.sessionClient,
      signer: {
        signMessage: ({ message }) =>
          walletClient.signMessage({
            account: session.connection.address,
            message,
          }),
      },
    };
  }, [config, getCurrentSession]);

  const cleanUpFromLatestAccount = useCallback(
    async (
      latestAccount: Account,
      signer: Signer,
      sessionClient: BoundSessionClient,
      announceEmpty = false,
    ) => {
      const cleanup = await cleanupManagedGroveResources({
        accountAddress: account.address,
        latestAccountMetadata: latestAccount.metadata,
        signer,
        revalidateLatestAccountMetadata: async () => {
          const refreshedAccount = await fetchAccount(sessionClient, {
            address: account.address,
          });

          if (
            refreshedAccount.isErr() ||
            !refreshedAccount.value ||
            !isExpectedAccount(refreshedAccount.value, account.address)
          ) {
            return { ok: false };
          }

          return {
            ok: true,
            metadata: refreshedAccount.value.metadata,
          };
        },
      });

      refreshManagedResourceCount();

      if (!cleanup.ok) {
        if (
          cleanup.reason === 'manifest-sync-failed' &&
          cleanup.manifestMayBeStale
        ) {
          setCleanupAvailable(false);
          setManagedResourceCount(0);
          toast.warning('Grove cleanup record could not be updated', {
            description: `${cleanup.deleted.length} app-managed ${cleanup.deleted.length === 1 ? 'image was' : 'images were'} deleted, but this browser could not save the result. Cleanup is disabled to avoid repeating those requests.`,
          });
          return;
        }

        toast.warning('Grove cleanup is unavailable', {
          description:
            cleanup.reason === 'unsupported-schema-version'
              ? '3bio found newer profile metadata and did not delete any Grove resources.'
              : cleanup.reason === 'metadata-inspection-failed'
                ? '3bio could not safely inspect every Lens metadata reference, so no Grove images were deleted.'
                : 'This browser could not access its managed Grove resource record, so nothing was deleted.',
        });
        return;
      }

      if (cleanup.candidates.length === 0) {
        if (announceEmpty) {
          toast.info('No Grove uploads are ready for cleanup', {
            description:
              'Pending, active, and currently referenced images remain protected. Metadata documents are retained.',
          });
        }
        return;
      }

      if (cleanup.retained.length > 0) {
        toast.warning('Some Grove uploads were retained', {
          description: `${cleanup.deleted.length} images deleted; ${cleanup.retained.length} could not be deleted. You can retry from this card.`,
        });
        return;
      }

      if (cleanup.deleted.length > 0) {
        toast.success('Grove cleanup complete', {
          description: `${cleanup.deleted.length} app-managed ${cleanup.deleted.length === 1 ? 'image was' : 'images were'} deleted.`,
        });
      }
    },
    [account.address, refreshManagedResourceCount],
  );

  const updatePublication = useCallback(
    async (
      status: ThreeBioPublicationStatus,
      action: Exclude<PrivacyDataAction, 'cleanup'>,
    ) => {
      if (actionInFlight.current) return;

      actionInFlight.current = true;
      setBusyAction(action);
      let uploadedRecords: GroveManagedResourceRecord[] = [];
      let submissionStarted = false;

      try {
        await withGroveAccountLock(account.address, async () => {
          const initialSession = getCurrentSession();

          if (!initialSession.sessionClient) {
            showError(getSessionErrorFeedback(initialSession.state));
            return;
          }

          const preparation = await prepareProfilePublicationUpdate({
            accountAddress: account.address,
            acl,
            sessionClient: initialSession.sessionClient,
            status,
          });

          if (!preparation.ok) {
            showError(
              getMetadataPreparationFailureFeedback(preparation.failure),
            );
            return;
          }

          const recorded = recordManagedGroveResources({
            accountAddress: account.address,
            resources: [
              {
                storageKey: preparation.metadataResource.storageKey,
                kind: 'metadata',
              },
            ],
          });

          if (recorded.ok) uploadedRecords = recorded.recorded;

          submissionStarted = true;
          const transaction = await submitMetadataUpdate({
            config,
            accountAddress: account.address,
            metadataUri: preparation.metadataResource.uri,
            getCurrentEditorSession: getCurrentSession,
          });

          if (!transaction.ok) {
            if (isDefinitiveMetadataUpdateFailure(transaction.failure)) {
              markManagedGroveResourcesOrphaned({
                accountAddress: account.address,
                resources: uploadedRecords,
              });
            }

            showError(getMetadataUpdateFailureFeedback(transaction.failure));
            return;
          }

          const manifestConfirmation = markGrovePublicationConfirmed({
            accountAddress: account.address,
            metadataKey: preparation.metadataResource.storageKey,
            referenceKeys: preparation.referenceKeys,
          });

          if (!manifestConfirmation.ok) {
            console.warn(
              '[usePrivacyData] The Lens update succeeded, but its Grove cleanup record could not be updated.',
            );
          }
          setPublicationStatus(status);

          toast.success(
            status === 'public'
              ? 'Your 3bio page is public'
              : status === 'opted-out'
                ? 'Your 3bio page is hidden'
                : 'Current 3bio data cleared',
            {
              description:
                status === 'deleted'
                  ? 'The deletion marker is live. Only eligible app-managed Grove images can be removed.'
                  : 'The publication setting is now live on Lens.',
            },
          );

          if (status !== 'deleted') {
            refreshManagedResourceCount();
            return;
          }

          try {
            const refreshedAccount = await fetchAccount(
              transaction.sessionClient,
              {
                address: account.address,
              },
            );

            if (
              refreshedAccount.isErr() ||
              !refreshedAccount.value ||
              !isExpectedAccount(refreshedAccount.value, account.address)
            ) {
              refreshManagedResourceCount();
              toast.warning('Grove cleanup was not started', {
                description:
                  'The deletion marker is live, but 3bio could not verify the latest Lens references. You can retry cleanup from this card.',
              });
              return;
            }

            const refreshedPublication = readProfilePublicationState(
              refreshedAccount.value.metadata?.attributes,
            );
            const signer =
              !refreshedPublication.hasUnsupportedSchemaVersion &&
              refreshedPublication.status === 'deleted'
                ? await getBoundWalletSigner()
                : null;

            if (signer) {
              await cleanUpFromLatestAccount(
                refreshedAccount.value,
                signer.signer,
                signer.sessionClient,
              );
            } else {
              refreshManagedResourceCount();
            }
          } catch {
            refreshManagedResourceCount();
            toast.warning('Grove cleanup did not finish', {
              description:
                'The deletion marker is live. Automatic Grove cleanup was interrupted; you can retry it from this card.',
            });
          }
        });
      } catch {
        if (!submissionStarted && uploadedRecords.length > 0) {
          markManagedGroveResourcesOrphaned({
            accountAddress: account.address,
            resources: uploadedRecords,
          });
        }

        toast.error('Could not update profile privacy', {
          description:
            'The request did not finish. If your wallet submitted a transaction, check the public profile before retrying.',
        });
      } finally {
        actionInFlight.current = false;
        setBusyAction(null);
      }
    },
    [
      account.address,
      acl,
      cleanUpFromLatestAccount,
      config,
      getBoundWalletSigner,
      getCurrentSession,
      refreshManagedResourceCount,
    ],
  );

  const cleanup = useCallback(async () => {
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    setBusyAction('cleanup');

    try {
      await withGroveAccountLock(account.address, async () => {
        const signer = await getBoundWalletSigner();

        if (!signer) return;

        const latestAccount = await fetchAccount(signer.sessionClient, {
          address: account.address,
        });

        if (
          latestAccount.isErr() ||
          !latestAccount.value ||
          !isExpectedAccount(latestAccount.value, account.address)
        ) {
          toast.error('Could not verify Grove references', {
            description:
              '3bio did not delete anything because the latest Lens metadata could not be checked.',
          });
          return;
        }

        await cleanUpFromLatestAccount(
          latestAccount.value,
          signer.signer,
          signer.sessionClient,
          true,
        );
      });
    } catch {
      toast.error('Could not clean up Grove uploads', {
        description:
          'No unverified resources were removed. You can try the cleanup again.',
      });
    } finally {
      actionInFlight.current = false;
      setBusyAction(null);
    }
  }, [account.address, cleanUpFromLatestAccount, getBoundWalletSigner]);

  return {
    publicationStatus,
    busyAction,
    cleanupAvailable,
    managedResourceCount,
    makePublic: () => updatePublication('public', 'make-public'),
    optOut: () => updatePublication('opted-out', 'opt-out'),
    deleteData: () => updatePublication('deleted', 'delete-data'),
    cleanup,
  };
};
