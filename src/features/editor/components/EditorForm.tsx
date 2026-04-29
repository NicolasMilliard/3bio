import { getHostname, type LensProfile, toMetadataAttribute } from '@/helpers';
import { chains } from '@lens-chain/sdk/viem';
import { lensAccountOnly, StorageClient } from '@lens-chain/storage-client';
import { uri } from '@lens-protocol/client';
import { setAccountMetadata } from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';
import {
  account as createMetadata,
  MetadataAttributeType,
} from '@lens-protocol/metadata';
import { useSessionClient } from '@lens-protocol/react';
import { useWalletClient } from 'wagmi';

import { SOCIAL_CONFIG } from '@/features/profile/model/social.config';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  profileFormSchema,
  type ProfileFormValues,
} from '../schemas/profile.schema';

const storageClient = StorageClient.create();

export const EditorForm = ({
  profile,
  children,
}: {
  profile: LensProfile;
  children: React.ReactNode;
}) => {
  const { data: sessionClient } = useSessionClient();
  const { data: walletClient } = useWalletClient();
  const acl = lensAccountOnly(profile.address, chains.mainnet.id);

  const methods = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      avatar: profile.avatar ?? '',
      name: profile.name ?? '',
      bio: profile.bio ?? '',
      socialLinks: Object.keys(SOCIAL_CONFIG).map((key) => {
        const existing = profile.socialLinks?.find((l) => l.type === key);
        return { type: key, url: existing?.value ?? '' };
      }),
      links: profile.links,
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    if (!sessionClient || !walletClient) {
      toast.error('Not connected', {
        description: 'Please connect your wallet to update your profile.',
      });
      return;
    }

    console.log('Submit form', values);

    const toastId = toast.loading('Uploading avatar...');

    try {
      // 1. Upload avatar if it's a new File
      const avatarUri =
        values.avatar instanceof File
          ? (await storageClient.uploadFile(values.avatar, { acl })).uri
          : values.avatar || profile.avatar;

      toast.loading('Uploading metadata...', { id: toastId });

      // 2. Handle attributes

      // Social links
      const socialLinkAttributes:
        | Array<{
            type: MetadataAttributeType.STRING;
            key: string;
            value: string;
          }>
        | undefined = values.socialLinks
        ?.filter((l): l is { type: string; url: string } => !!l.url?.trim())
        .map((l) => ({
          type: MetadataAttributeType.STRING,
          key: `socialLinks.${l.type}`,
          value: l.url.trim(),
        }));

      // Links
      const linkAttributes:
        | Array<{
            type: MetadataAttributeType.STRING;
            key: string;
            value: string;
          }>
        | undefined = values.links?.map((l) => ({
        type: MetadataAttributeType.STRING,
        key: `links.${getHostname(l)}`,
        value: l,
      }));

      // Other attributes
      const nonManagedAttributes = (profile.attributes ?? [])
        .filter((a) => !a.key.startsWith('socialLinks.'))
        .map(toMetadataAttribute);

      const allAttributes = [
        ...nonManagedAttributes,
        ...(socialLinkAttributes ?? []),
        ...(linkAttributes ?? []),
      ];

      // 3. Create and upload metadata
      const data = createMetadata({
        name: values.name || profile.name || undefined,
        bio: values.bio || profile.bio || undefined,
        picture: avatarUri || undefined,
        ...(allAttributes.length > 0 && { attributes: allAttributes }),
      });

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
