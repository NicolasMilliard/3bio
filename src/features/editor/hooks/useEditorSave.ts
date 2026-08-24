import { chains } from '@lens-chain/sdk/viem';
import { lensAccountOnly } from '@lens-chain/storage-client';
import { fetchAccount } from '@lens-protocol/client/actions';
import type { Account } from '@lens-protocol/react';
import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { useConfig } from 'wagmi';

import {
  getMetadataPreparationFailureFeedback,
  getMetadataUpdateFailureFeedback,
  getSessionErrorFeedback,
} from '../helpers/editorSaveFeedback';
import {
  isDefinitiveMetadataUpdateFailure,
  recordEditorGroveUpload,
  shouldOrphanEditorUploadsAfterThrow,
} from '../helpers/editorGroveLifecycle';
import {
  buildSavedEditorFormValues,
  getPersistedThreeBioDirtyFields,
} from '../helpers/editorFormValues';
import {
  getSaveErrorFeedback,
  type SaveStage,
} from '../helpers/saveErrorFeedback';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';
import { getEditorSessionSnapshot } from '../services/getEditorSessionSnapshot';
import {
  markGrovePublicationConfirmed,
  markManagedGroveResourcesOrphaned,
  type GroveManagedResourceRecord,
} from '../services/groveManagedResourceManifest';
import {
  uploadEditorImages,
  validateEditorImages,
  type EditorImageField,
} from '../services/prepareEditorImages';
import {
  prepareEditorMetadataUpdate,
  type MetadataUploadCacheEntry,
} from '../services/prepareEditorMetadataUpdate';
import { submitMetadataUpdate } from '../services/submitMetadataUpdate';
import { withGroveAccountLock } from '../services/withGroveAccountLock';

type UseEditorSaveInput = {
  account: Account;
  methods: UseFormReturn<MetadataFormValues>;
};

const imageUploadStage: Record<EditorImageField, SaveStage> = {
  avatar: 'uploading-avatar',
  coverPicture: 'uploading-social-image',
  linksPanelBackground: 'uploading-links-panel-background',
};

const imageUploadMessage: Record<EditorImageField, string> = {
  avatar: 'Uploading avatar...',
  coverPicture: 'Uploading social image...',
  linksPanelBackground: 'Uploading panel background...',
};

const showFeedback = (
  feedback: { title: string; description: string },
  toastId?: string | number,
) => {
  toast.error(feedback.title, {
    id: toastId,
    description: feedback.description,
  });
};

export const useEditorSave = ({ account, methods }: UseEditorSaveInput) => {
  const config = useConfig();
  const saveInFlight = useRef(false);
  const lockRequestInFlight = useRef(false);
  const metadataUploadCache = useRef<MetadataUploadCacheEntry | null>(null);
  const acl = lensAccountOnly(account.address, chains.mainnet.id);
  const getCurrentEditorSession = () =>
    getEditorSessionSnapshot(config, account.address);

  const onSubmitWithLockHeld = async (values: MetadataFormValues) => {
    const isImageValidationPending =
      values._imageValidation.avatar ||
      values._imageValidation.coverPicture ||
      values._imageValidation.linksPanelBackground;

    if (
      saveInFlight.current ||
      !methods.formState.isDirty ||
      isImageValidationPending
    ) {
      if (isImageValidationPending) {
        toast.info('Checking your image', {
          description: 'Wait for the image check to finish before saving.',
        });
      }
      return;
    }

    saveInFlight.current = true;
    let saveStage: SaveStage = 'validating-images';
    let toastId: string | number | undefined;
    const attemptResources: GroveManagedResourceRecord[] = [];
    const recordUpload = (storageKey: string, kind: 'image' | 'metadata') => {
      const resource = recordEditorGroveUpload({
        accountAddress: account.address,
        storageKey,
        kind,
      });

      if (!resource) {
        console.warn(
          '[useEditorSave] Could not record a Grove upload for later cleanup.',
        );
        return;
      }

      attemptResources.push(resource);
    };
    const orphanAttemptResources = () => {
      if (attemptResources.length === 0) return;

      const result = markManagedGroveResourcesOrphaned({
        accountAddress: account.address,
        resources: attemptResources,
      });

      if (!result.ok) {
        console.warn(
          '[useEditorSave] Could not update the local Grove cleanup record.',
        );
      }
    };

    try {
      const imageErrors = await validateEditorImages(values);

      for (const field of [
        'avatar',
        'coverPicture',
        'linksPanelBackground',
      ] as const) {
        const error = imageErrors[field];

        if (error !== undefined) {
          methods.setError(`${field}.file`, {
            type: 'validate',
            message: error,
          });
        } else {
          methods.clearErrors(`${field}.file`);
        }
      }

      if (Object.keys(imageErrors).length > 0) {
        toast.error('Check your profile images', {
          description: 'Correct the highlighted images before saving.',
        });
        return;
      }

      const initialSession = getCurrentEditorSession();

      if (!initialSession.sessionClient) {
        showFeedback(getSessionErrorFeedback(initialSession.state));
        return;
      }

      toastId = toast.loading(
        values.avatar.file
          ? 'Uploading avatar...'
          : values.coverPicture.file
            ? 'Uploading social image...'
            : values.linksPanelBackground.file
              ? 'Uploading panel background...'
              : 'Saving profile...',
      );

      const imageUris = await uploadEditorImages({
        values,
        acl,
        onUploadStart: (field) => {
          saveStage = imageUploadStage[field];
          toast.loading(imageUploadMessage[field], { id: toastId });
        },
        onUploaded: (field, resource) => {
          recordUpload(resource.storageKey, 'image');
          methods.setValue(
            field,
            { preview: resource.gatewayUrl },
            { shouldDirty: true, shouldValidate: true },
          );
        },
      });

      saveStage = 'uploading-profile-data';
      toast.loading('Uploading profile data...', { id: toastId });

      const latestAccountSession = getCurrentEditorSession();

      if (!latestAccountSession.sessionClient) {
        orphanAttemptResources();
        showFeedback(
          getSessionErrorFeedback(latestAccountSession.state),
          toastId,
        );
        return;
      }

      const dirtyFields = getPersistedThreeBioDirtyFields(
        methods.formState.dirtyFields,
      );
      const metadataPreparation = await prepareEditorMetadataUpdate({
        accountAddress: account.address,
        acl,
        cacheEntry: metadataUploadCache.current,
        dirtyFields,
        imageUris: {
          avatarUri: methods.formState.dirtyFields.avatar
            ? imageUris.avatarUri
            : undefined,
          coverPictureUri: methods.formState.dirtyFields.coverPicture
            ? imageUris.coverPictureUri
            : undefined,
          linksPanelBackgroundUri: methods.formState.dirtyFields
            .linksPanelBackground
            ? imageUris.linksPanelBackgroundUri
            : undefined,
        },
        sessionClient: latestAccountSession.sessionClient,
        values,
        onUploaded: (resource) => {
          recordUpload(resource.storageKey, 'metadata');
        },
      });

      if (!metadataPreparation.ok) {
        orphanAttemptResources();

        if (
          metadataPreparation.failure.kind === 'latest-account-fetch-failed'
        ) {
          console.warn(
            '[useEditorSave] Could not load the latest Lens profile before saving:',
            metadataPreparation.failure.error,
          );
        }

        showFeedback(
          getMetadataPreparationFailureFeedback(metadataPreparation.failure),
          toastId,
        );
        return;
      }

      metadataUploadCache.current = metadataPreparation.cacheEntry;
      const {
        latestAccount,
        metadataResource,
        metadataReferenceKeys,
        metadataUri,
        nextThreeBioMetadata,
      } = metadataPreparation;

      saveStage = 'submitting-transaction';
      toast.loading('Waiting for transaction...', { id: toastId });

      const transaction = await submitMetadataUpdate({
        config,
        accountAddress: account.address,
        metadataUri,
        getCurrentEditorSession,
        onProgress: (progress) => {
          if (progress === 'switching-network') {
            toast.loading('Switch your wallet to Lens...', { id: toastId });
            return;
          }

          saveStage = 'confirming-transaction';
          toast.loading('Confirming profile update...', { id: toastId });
        },
      });

      if (!transaction.ok) {
        if (isDefinitiveMetadataUpdateFailure(transaction.failure)) {
          orphanAttemptResources();
        }

        if (
          transaction.failure.kind === 'confirmation-failed' ||
          transaction.failure.kind === 'submission-unknown'
        ) {
          console.warn(
            '[useEditorSave] Lens could not verify the transaction outcome:',
            transaction.failure.error,
          );
        }

        showFeedback(
          getMetadataUpdateFailureFeedback(transaction.failure),
          toastId,
        );
        return;
      }

      const manifestConfirmation = markGrovePublicationConfirmed({
        accountAddress: account.address,
        metadataKey: metadataResource.storageKey,
        referenceKeys: metadataReferenceKeys,
      });

      if (!manifestConfirmation.ok) {
        console.warn(
          '[useEditorSave] Profile saved, but the local Grove cleanup record could not be updated.',
        );
      }

      const refreshResult = await fetchAccount(transaction.sessionClient, {
        address: account.address,
      });

      if (refreshResult.isErr()) {
        console.warn(
          '[useEditorSave] Profile saved, but refreshing the Lens cache failed:',
          refreshResult.error,
        );
      }

      const refreshedAccount = refreshResult.isOk()
        ? (refreshResult.value ?? undefined)
        : undefined;

      methods.reset(
        buildSavedEditorFormValues(
          refreshedAccount ?? latestAccount,
          nextThreeBioMetadata,
        ),
      );
      metadataUploadCache.current = null;
      toast.success('Profile saved!', {
        id: toastId,
        description: 'Your changes are now live.',
      });
    } catch {
      if (shouldOrphanEditorUploadsAfterThrow(saveStage)) {
        orphanAttemptResources();
      }

      const feedback = getSaveErrorFeedback(saveStage);

      toast.error(feedback.title, {
        id: toastId,
        description: feedback.description,
      });
    } finally {
      saveInFlight.current = false;
    }
  };

  const onSubmit = async (values: MetadataFormValues) => {
    if (lockRequestInFlight.current) return;

    lockRequestInFlight.current = true;

    try {
      await withGroveAccountLock(account.address, () =>
        onSubmitWithLockHeld(values),
      );
    } catch {
      toast.error('Could not start this save', {
        description:
          '3bio could not coordinate this profile with another browser tab. Try again.',
      });
    } finally {
      lockRequestInFlight.current = false;
    }
  };

  return { onSubmit };
};
