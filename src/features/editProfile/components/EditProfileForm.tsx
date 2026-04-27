import { SOCIAL_CONFIG } from '@/features/profile/model/social.config';
import { type LensProfile, toMetadataAttribute } from '@/helpers';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useWalletClient } from 'wagmi';
import { z } from 'zod';

import { Button } from '@/components/ui';
import { EditableIdentity } from './EditableIdentity';
import { AddSocialIconLink, EditableSocialIcons } from './socialIcons';

const storageClient = StorageClient.create();

const socialLinkSchema = z.object({
  type: z.string(),
  url: z.url().or(z.literal('')),
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

const formSchema = z.object({
  avatar: z.union([z.instanceof(File), z.url(), z.literal('')]).optional(),
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  socialLinks: z.array(socialLinkSchema),
});

type FormValues = z.infer<typeof formSchema>;

export const EditProfileForm = ({ profile }: { profile: LensProfile }) => {
  const { data: sessionClient } = useSessionClient();
  const { data: walletClient } = useWalletClient();

  const acl = lensAccountOnly(profile.address, chains.mainnet.id);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      avatar: profile.avatar ?? '',
      name: profile.name ?? '',
      bio: profile.bio ?? '',
      socialLinks: Object.keys(SOCIAL_CONFIG).map((key) => {
        const existing = profile.socialLinks?.find((l) => l.type === key);
        return { type: key, url: existing?.value ?? '' };
      }),
    },
  });
  const {
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset((prev) => ({
      ...prev,
      socialLinks: Object.keys(SOCIAL_CONFIG).map((key) => {
        const existing = profile.socialLinks?.find((l) => l.type === key);
        return { type: key, url: existing?.value ?? '' };
      }),
    }));
  }, [profile, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!sessionClient || !walletClient) {
      toast.error('Not connected', {
        description: 'Please connect your wallet to update your profile.',
      });
      return;
    }

    const toastId = toast.loading('Uploading avatar…');

    try {
      // 1. Upload avatar if it's a new File
      const avatarUri =
        values.avatar instanceof File
          ? (await storageClient.uploadFile(values.avatar, { acl })).uri
          : values.avatar || profile.avatar;

      toast.loading('Uploading metadata…', { id: toastId });

      // 2. Handle attributes
      const linkAttributes: Array<{
        type: MetadataAttributeType.STRING;
        key: string;
        value: string;
      }> = values.socialLinks
        .filter((l): l is { type: string; url: string } => !!l.url?.trim())
        .map((l) => ({
          type: MetadataAttributeType.STRING,
          key: `socialLinks.${l.type}`,
          value: l.url.trim(),
        }));
      const nonManagedAttributes = (profile.attributes ?? [])
        .filter((a) => !a.key.startsWith('socialLinks.'))
        .map(toMetadataAttribute);
      const allAttributes = [...nonManagedAttributes, ...linkAttributes];

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

      toast.loading('Waiting for transaction…', { id: toastId });

      // 4. Submit onchain
      const result = await setAccountMetadata(sessionClient, {
        metadataUri: uri(metadataUri),
      }).andThen(handleOperationWith(walletClient));

      if (result.isErr()) {
        throw new Error(result.error.message ?? 'Transaction failed');
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
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <EditableIdentity profile={profile} />
        <div className="flex justify-center gap-2">
          <EditableSocialIcons />
          <AddSocialIconLink />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </FormProvider>
  );
};
