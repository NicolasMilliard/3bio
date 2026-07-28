import { chains } from '@lens-chain/sdk/viem';
import { lensAccountOnly, StorageClient } from '@lens-chain/storage-client';
import {
  fetchAccount,
  setAccountMetadata,
} from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';
import { uri, type Account } from '@lens-protocol/react';
import { getConnection, getWalletClient, switchChain } from '@wagmi/core';
import { useConfig } from 'wagmi';

import { SOCIAL_MAP, THREE_BIO_DEFAULT_THEME } from '@/constants';
import {
  resolveAccountSessionBinding,
  type AccountSessionBindingState,
} from '@/features/auth/sessionBinding';
import { formatMetadataBeforeUpload, formatSocialLink } from '@/helpers';
import { client } from '@/lib';
import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { useForm, type SubmitErrorHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { buildPersistedThreeBioMetadata } from '../helpers/buildPersistedThreeBioMetadata';
import { getTransactionFailureReason } from '../helpers/getTransactionFailureReason';
import { getMetadataUploadCacheKey } from '../helpers/metadataUploadCache';
import {
  getSaveErrorFeedback,
  type SaveStage,
} from '../helpers/saveErrorFeedback';
import { validateImageUpload } from '../schemas/imageUpload.schema';
import {
  metadataFormSchema,
  type MetadataFormValues,
} from '../schemas/metadataForm.schema';

// Singleton: intentionally created once at module level to avoid
// re-instantiating the storage client on every render.
const storageClient = StorageClient.create();

// Stable ordered list of social platforms delivered from SOCIAL_MAP.
const SOCIAL_PLATFORMS = Array.from(Object.keys(SOCIAL_MAP));

function buildDefaultValues(
  threeBioMetadata: ThreeBioMetadata,
): MetadataFormValues {
  const profile = threeBioMetadata.profile;
  const theme = threeBioMetadata.theme;

  return {
    _imageValidation: {
      avatar: false,
      coverPicture: false,
    },
    avatar: { preview: profile?.avatar ?? null },
    coverPicture: { preview: profile?.coverPicture ?? null },
    name: profile?.name ?? '',
    bio: profile?.bio ?? '',
    socialLinks: SOCIAL_PLATFORMS.map((key) => {
      const existing = profile?.socialLinks?.find(
        (socialLink) => formatSocialLink(socialLink).platform === key,
      );
      return { platform: key, url: existing?.value };
    }),
    links: profile?.links?.map((link) => link.value) ?? [],
    theme: theme?.name ?? THREE_BIO_DEFAULT_THEME,
    displayStatistics: theme?.displayStatistics ?? true,
    displayBranding: theme?.displayBranding ?? true,
  };
}

export function useEditorForm(
  account: Account,
  threeBioMetadata: ThreeBioMetadata,
) {
  const config = useConfig();
  const saveInFlight = useRef(false);
  const metadataUploadCache = useRef<{
    key: string;
    uri: string;
  } | null>(null);
  const acl = lensAccountOnly(account.address, chains.mainnet.id);

  const methods = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataFormSchema),
    defaultValues: buildDefaultValues(threeBioMetadata),
  });

  const getCurrentEditorSession = () => {
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
      accountAddress: account.address,
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

  const showSessionError = (
    state: AccountSessionBindingState,
    toastId?: string | number,
  ) => {
    const messages: Record<
      AccountSessionBindingState,
      { title: string; description: string }
    > = {
      pending: {
        title: 'Wallet connection is updating',
        description: 'Wait for your wallet to finish reconnecting, then save.',
      },
      'wallet-disconnected': {
        title: 'Wallet disconnected',
        description:
          'Reconnect the wallet that manages this Lens profile before saving.',
      },
      'session-missing': {
        title: 'Lens session expired',
        description: 'Sign in to your Lens profile again before saving.',
      },
      mismatch: {
        title: 'Different wallet connected',
        description:
          'Switch back to the wallet that manages this Lens profile.',
      },
      'account-mismatch': {
        title: 'Lens profile changed',
        description:
          'Switch back to this Lens profile before saving its draft.',
      },
      bound: {
        title: 'Wallet session changed',
        description: 'Check your wallet connection and try again.',
      },
    };

    const message = messages[state];
    toast.error(message.title, {
      id: toastId,
      description: message.description,
    });
  };

  const onSubmit = async (values: MetadataFormValues) => {
    const isImageValidationPending =
      values._imageValidation.avatar || values._imageValidation.coverPicture;

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

    try {
      const imageFields = [
        ['avatar', values.avatar.file],
        ['coverPicture', values.coverPicture.file],
      ] as const;
      const imageErrors: Array<{
        field: (typeof imageFields)[number][0];
        error: string | null;
      }> = [];

      for (const [field, file] of imageFields) {
        imageErrors.push({
          field,
          error: file ? await validateImageUpload(file) : null,
        });
      }

      let hasImageError = false;

      imageErrors.forEach(({ field, error }) => {
        if (error) {
          hasImageError = true;
          methods.setError(`${field}.file`, {
            type: 'validate',
            message: error,
          });
        } else {
          methods.clearErrors(`${field}.file`);
        }
      });

      if (hasImageError) {
        toast.error('Check your profile images', {
          description: 'Correct the highlighted images before saving.',
        });
        return;
      }

      const initialSession = getCurrentEditorSession();

      if (!initialSession.sessionClient) {
        showSessionError(initialSession.state);
        return;
      }

      toastId = toast.loading(
        values.avatar.file
          ? 'Uploading avatar...'
          : values.coverPicture.file
            ? 'Uploading social image...'
            : 'Saving profile...',
      );

      // Step 1: Upload avatar if a new file was selected
      let avatarUri = values.avatar.preview;

      if (values.avatar.file) {
        saveStage = 'uploading-avatar';
        const avatarUpload = await storageClient.uploadFile(
          values.avatar.file,
          { acl },
        );
        avatarUri = avatarUpload.gatewayUrl;

        methods.setValue(
          'avatar',
          { preview: avatarUri },
          { shouldDirty: true, shouldValidate: true },
        );
      }

      // Step 2: Upload cover picture if a new file was selected
      let coverPictureUri = values.coverPicture.preview;

      if (values.coverPicture.file) {
        saveStage = 'uploading-social-image';
        toast.loading('Uploading social image...', { id: toastId });
        const coverPictureUpload = await storageClient.uploadFile(
          values.coverPicture.file,
          { acl },
        );
        coverPictureUri = coverPictureUpload.gatewayUrl;

        methods.setValue(
          'coverPicture',
          { preview: coverPictureUri },
          { shouldDirty: true, shouldValidate: true },
        );
      }

      // Step 3: Build and upload metadata JSON
      saveStage = 'uploading-profile-data';
      toast.loading('Uploading profile data...', { id: toastId });

      const nextThreeBioMetadata = buildPersistedThreeBioMetadata({
        current: threeBioMetadata,
        values,
        avatarUri,
        coverPictureUri,
      });

      const metadataKey = getMetadataUploadCacheKey(
        account.metadata,
        nextThreeBioMetadata,
      );
      let metadataUri =
        metadataUploadCache.current?.key === metadataKey
          ? metadataUploadCache.current.uri
          : undefined;

      if (!metadataUri) {
        const data = formatMetadataBeforeUpload(account, nextThreeBioMetadata);
        const upload = await storageClient.uploadAsJson(data, { acl });
        metadataUri = upload.uri;
        metadataUploadCache.current = {
          key: metadataKey,
          uri: metadataUri,
        };
      }

      // Step 4: Submit on-chain
      saveStage = 'submitting-transaction';
      toast.loading('Waiting for transaction...', { id: toastId });

      const transactionSession = getCurrentEditorSession();

      if (
        !transactionSession.sessionClient ||
        !transactionSession.authenticatedUser
      ) {
        showSessionError(transactionSession.state, toastId);
        return;
      }

      const operation = await setAccountMetadata(
        transactionSession.sessionClient,
        {
          metadataUri: uri(metadataUri),
        },
      );

      if (operation.isErr()) {
        toast.error('Transaction failed', {
          id: toastId,
          description: operation.error.message ?? 'An error occurred.',
        });
        return;
      }

      const operationResult = operation.value;
      const failureReason = getTransactionFailureReason(operationResult);

      if (failureReason !== null) {
        toast.error('Transaction failed', {
          id: toastId,
          description: failureReason,
        });
        return;
      }

      let transactionHash =
        'hash' in operationResult ? operationResult.hash : undefined;

      if (!('hash' in operationResult)) {
        const signingConnection = getConnection(config);

        if (signingConnection.status !== 'connected') {
          showSessionError(
            resolveAccountSessionBinding({
              walletStatus: signingConnection.status,
              walletAddress: signingConnection.address,
              lensLoading: false,
              session: transactionSession.authenticatedUser,
              accountAddress: account.address,
            }),
            toastId,
          );
          return;
        }

        if (signingConnection.chainId !== chains.mainnet.id) {
          toast.loading('Switch your wallet to Lens...', { id: toastId });

          try {
            await switchChain(config, {
              chainId: chains.mainnet.id,
              connector: signingConnection.connector,
            });
          } catch {
            toast.error('Lens network required', {
              id: toastId,
              description:
                'Switch your wallet to the Lens network to complete this save.',
            });
            return;
          }
        }

        const signingSession = getCurrentEditorSession();

        if (
          !signingSession.sessionClient ||
          !signingSession.authenticatedUser ||
          signingSession.connection.status !== 'connected'
        ) {
          showSessionError(signingSession.state, toastId);
          return;
        }

        if (
          signingSession.authenticatedUser.authenticationId !==
          transactionSession.authenticatedUser.authenticationId
        ) {
          toast.error('Lens session changed', {
            id: toastId,
            description:
              'Your profile changed before the transaction was sent.',
          });
          return;
        }

        const walletClient = await getWalletClient(config, {
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
          showSessionError(finalSession.state, toastId);
          return;
        }

        if (
          finalSession.authenticatedUser.authenticationId !==
          transactionSession.authenticatedUser.authenticationId
        ) {
          toast.error('Lens session changed', {
            id: toastId,
            description:
              'Your profile changed before the transaction was sent.',
          });
          return;
        }

        if (finalSession.connection.chainId !== chains.mainnet.id) {
          toast.error('Lens network required', {
            id: toastId,
            description:
              'Switch your wallet back to the Lens network and try again.',
          });
          return;
        }

        const result = await handleOperationWith(walletClient)(operationResult);

        if (result.isErr()) {
          toast.error('Transaction failed', {
            id: toastId,
            description: result.error.message ?? 'An error occurred.',
          });
          return;
        }

        transactionHash = result.value;
      }

      if (!transactionHash) {
        toast.error('Transaction failed', {
          id: toastId,
          description: 'The wallet did not return a transaction hash.',
        });
        return;
      }

      saveStage = 'confirming-transaction';
      toast.loading('Confirming profile update...', { id: toastId });

      const confirmation =
        await transactionSession.sessionClient.waitForTransaction(
          transactionHash,
        );

      if (confirmation.isErr()) {
        const feedback = getSaveErrorFeedback('confirming-transaction');

        console.warn(
          '[useEditorForm] Lens could not confirm the submitted transaction:',
          confirmation.error,
        );
        toast.error(feedback.title, {
          id: toastId,
          description: feedback.description,
        });
        return;
      }

      // Refresh the shared Lens cache so dashboard/editor consumers do not keep
      // rendering the pre-save account metadata.
      const refreshResult = await fetchAccount(
        transactionSession.sessionClient,
        {
          address: account.address,
        },
      );

      if (refreshResult.isErr()) {
        console.warn(
          '[useEditorForm] Profile saved, but refreshing the Lens cache failed:',
          refreshResult.error,
        );
      }

      methods.reset({
        ...values,
        avatar: { preview: avatarUri ?? null },
        coverPicture: { preview: coverPictureUri ?? null },
      });
      metadataUploadCache.current = null;
      toast.success('Profile saved!', {
        id: toastId,
        description: 'Your changes are now live.',
      });
    } catch {
      const feedback = getSaveErrorFeedback(saveStage);

      toast.error(feedback.title, {
        id: toastId,
        description: feedback.description,
      });
    } finally {
      saveInFlight.current = false;
    }
  };

  const onInvalid: SubmitErrorHandler<MetadataFormValues> = (errors) => {
    const hasLinkError = Boolean(errors.links || errors.socialLinks);

    toast.error(
      hasLinkError ? 'Check your profile links' : 'Check your profile details',
      {
        description: hasLinkError
          ? 'Use complete HTTP or HTTPS URLs that match the selected platform.'
          : 'Correct the invalid fields before saving.',
      },
    );
  };

  return { methods, onSubmit, onInvalid };
}
