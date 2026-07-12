import { chains } from '@lens-chain/sdk/viem';
import { lensAccountOnly, StorageClient } from '@lens-chain/storage-client';
import { setAccountMetadata } from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';
import { MetadataAttributeType } from '@lens-protocol/metadata';
import { uri, useSessionClient, type Account } from '@lens-protocol/react';
import { useWalletClient } from 'wagmi';

import { SOCIAL_MAP, THREE_BIO_DEFAULT_THEME } from '@/constants';
import {
  formatMetadataBeforeUpload,
  formatSocialLink,
  getHostname,
} from '@/helpers';
import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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

export function buildSocialLinkAttributes(
  socialLinks: MetadataFormValues['socialLinks'],
) {
  return (socialLinks ?? [])
    .filter((l): l is { platform: string; url: string } => !!l.url?.trim())
    .map((l) => ({
      type: MetadataAttributeType.STRING,
      key: `socialLinks.${l.platform}`,
      value: l.url.trim(),
    }));
}

export function buildLinkAttributes(links: MetadataFormValues['links']) {
  return (links ?? [])
    .filter(Boolean) // guard against empty strings
    .map((l) => {
      const hostname = getHostname(l);
      // Guard against malformed URLs that would produce a null/undefined key
      const key = hostname ? `links.${hostname}` : `links.unknown`;
      return { type: MetadataAttributeType.STRING, key, value: l };
    });
}

export function useEditorForm(
  account: Account,
  threeBioMetadata: ThreeBioMetadata,
) {
  const { data: sessionClient } = useSessionClient();
  const { data: walletClient } = useWalletClient();
  const acl = lensAccountOnly(account.address, chains.mainnet.id);

  const methods = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataFormSchema),
    defaultValues: buildDefaultValues(threeBioMetadata),
  });

  const onSubmit = async (values: MetadataFormValues) => {
    if (!sessionClient) {
      toast.error('Not connected', {
        description: 'Please connect your wallet to update your profile.',
      });
      return;
    }

    const toastId = toast.loading('Uploading avatar...');

    try {
      // Step 1: Upload avatar if a new file was selected
      const avatarUpload = values.avatar.file
        ? await storageClient.uploadFile(values.avatar.file, { acl })
        : null;
      const avatarUri = avatarUpload?.gatewayUrl ?? values.avatar.preview;

      // Step 2: Upload cover picture if a new file was selected
      toast.loading('Uploading cover picture...', { id: toastId });
      const coverPictureUpload = values.coverPicture.file
        ? await storageClient.uploadFile(values.coverPicture.file, { acl })
        : null;
      const coverPictureUri =
        coverPictureUpload?.gatewayUrl ?? values.coverPicture.preview;

      // Step 3: Build and upload metadata JSON
      toast.loading('Uploading metadata...', { id: toastId });

      const nextThreeBioMetadata = {
        ...threeBioMetadata,
        profile: {
          avatar: avatarUri ?? undefined,
          coverPicture: coverPictureUri ?? undefined,
          name: values.name,
          bio: values.bio,
          socialLinks: buildSocialLinkAttributes(values.socialLinks),
          links: buildLinkAttributes(values.links),
        },
        theme: {
          name: values.theme,
          displayStatistics: values.displayStatistics ?? true,
          displayBranding: values.displayBranding ?? true,
        },
      };

      const data = formatMetadataBeforeUpload(account, nextThreeBioMetadata);
      const { uri: metadataUri } = await storageClient.uploadAsJson(data, {
        acl,
      });

      // Step 4: Submit on-chain
      toast.loading('Waiting for transaction...', { id: toastId });

      const result = await setAccountMetadata(sessionClient, {
        metadataUri: uri(metadataUri),
      }).andThen(handleOperationWith(walletClient));

      if (result.isErr()) {
        toast.error('Transaction failed', {
          id: toastId,
          description: result.error.message ?? 'An error occurred.',
        });
        return;
      }

      methods.reset(values);
      toast.success('Profile saved!', {
        id: toastId,
        description: 'Your changes are now live.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';

      const description = message.toLowerCase().includes('upload')
        ? 'Failed to upload your files. Check your connection and try again.'
        : 'Something went wrong. Please try again or contact support.';

      toast.error('Failed to save profile', { id: toastId, description });
    }
  };

  return { methods, onSubmit };
}
