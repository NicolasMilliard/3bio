import { formatMetadataBeforeUpload, getHostname } from '@/helpers';
import { type InBioMetadata } from '@/schemas/inBioMetadata.schema';
import { chains } from '@lens-chain/sdk/viem';
import { lensAccountOnly, StorageClient } from '@lens-chain/storage-client';
import { uri, type Account } from '@lens-protocol/client';
import { setAccountMetadata } from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';
import { MetadataAttributeType } from '@lens-protocol/metadata';
import { useSessionClient } from '@lens-protocol/react';
import { useWalletClient } from 'wagmi';

import { SOCIAL_MAP } from '@/constants';
import { formatSocialLink } from '@/helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  profileFormSchema,
  type ProfileFormValues,
} from '../schemas/profileForm.schema';

const storageClient = StorageClient.create();

export const EditorForm = ({
  account,
  inBioMetadata,
  children,
}: {
  account: Account;
  inBioMetadata: InBioMetadata;
  children: React.ReactNode;
}) => {
  const inBioProfile = inBioMetadata.profile;
  const { data: sessionClient } = useSessionClient();
  const { data: walletClient } = useWalletClient();
  const acl = lensAccountOnly(account.address, chains.mainnet.id);

  const methods = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      avatar: {
        preview: inBioProfile?.avatar ?? '',
      },
      coverPicture: {
        preview: inBioProfile?.coverPicture ?? '',
      },
      name: inBioProfile?.name ?? '',
      bio: inBioProfile?.bio ?? '',
      socialLinks: Object.keys(SOCIAL_MAP).map((key) => {
        const existingSocialLink = inBioProfile?.socialLinks?.find(
          (socialLink) => formatSocialLink(socialLink).platform === key,
        );
        return { platform: key, url: existingSocialLink?.value };
      }),
      links: inBioProfile?.links?.map((link) => link.value),
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    if (!sessionClient || !walletClient) {
      toast.error('Not connected', {
        description: 'Please connect your wallet to update your profile.',
      });
      return;
    }

    const toastId = toast.loading('Uploading avatar...');

    try {
      // 1. Upload avatar if it's a new File
      const avatarUri = values.avatar.file
        ? (await storageClient.uploadFile(values.avatar.file, { acl })).uri
        : values.avatar.preview;

      toast.loading('Uploading cover picture...', { id: toastId });

      // 2. Upload coverPicture if it's a new File
      const coverPictureUri = values.coverPicture.file
        ? (await storageClient.uploadFile(values.coverPicture.file, { acl }))
            .uri
        : values.coverPicture.preview;

      toast.loading('Uploading metadata...', { id: toastId });

      // 2. Handle attributes

      // Social links
      const socialLinkAttributes = values.socialLinks
        ?.filter((l): l is { platform: string; url: string } => !!l.url?.trim())
        .map((l) => ({
          type: MetadataAttributeType.STRING,
          key: `socialLinks.${l.platform}`,
          value: l.url.trim(),
        }));

      // Links
      const linkAttributes = values.links?.map((l) => ({
        type: MetadataAttributeType.STRING,
        key: `links.${getHostname(l)}`,
        value: l,
      }));

      const nextInBioProfile = {
        coverPicture: coverPictureUri,
        avatar: avatarUri,
        name: values.name,
        bio: values.bio,
        socialLinks: socialLinkAttributes ?? [],
        links: linkAttributes ?? [],
      };

      const nextInBioMetadata = {
        ...inBioMetadata,
        profile: nextInBioProfile,
      };

      // 3. Create and upload metadata
      const data = formatMetadataBeforeUpload(account, nextInBioMetadata);

      const { uri: metadataUri } = await storageClient.uploadAsJson(data, {
        acl,
      });

      toast.loading('Waiting for transaction...', { id: toastId });

      // 4. Submit onchain
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

      toast.success('Profile saved!', {
        id: toastId,
        description: 'Your changes are now live.',
      });
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : 'Something went wrong';

      // Provide specific guidance for known failure modes
      const description = message.includes('upload')
        ? 'Failed to upload your files. Check your connection and try again.'
        : 'Something went wrong. Please try again or contact support.';

      toast.error('Failed to save profile', { id: toastId, description });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
};
