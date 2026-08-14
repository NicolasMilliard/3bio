import { THREE_BIO_DEFAULT_THEME } from '@/constants';
import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import type { Account } from '@lens-protocol/react';
import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import type { PersistedThreeBioDirtyFields } from './buildPersistedThreeBioMetadata';
import { hydrateSocialLinks } from './socialLinkOrdering';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

export const buildEditorFormDefaultValues = (
  threeBioMetadata: ThreeBioMetadata,
): MetadataFormValues => {
  const profile = threeBioMetadata.profile;
  const theme = threeBioMetadata.theme;

  return {
    _imageValidation: {
      avatar: false,
      coverPicture: false,
      linksPanelBackground: false,
    },
    avatar: { preview: profile?.avatar ?? null },
    coverPicture: { preview: profile?.coverPicture ?? null },
    linksPanelBackground: {
      preview: profile?.linksPanelBackground ?? null,
    },
    name: profile?.name ?? '',
    bio: profile?.bio ?? '',
    socialLinks: hydrateSocialLinks(profile?.socialLinks),
    links: profile?.links?.map((link) => link.value) ?? [],
    theme: theme?.name ?? THREE_BIO_DEFAULT_THEME,
    displayStatistics: theme?.displayStatistics ?? true,
    displayBranding: theme?.displayBranding ?? true,
  };
};

export const buildSavedEditorFormValues = (
  account: Account,
  threeBioMetadata: ThreeBioMetadata,
): MetadataFormValues => {
  const nativeMetadata = account.metadata;
  const profile = threeBioMetadata.profile;
  const tombstones = new Set(threeBioMetadata.tombstones ?? []);

  return buildEditorFormDefaultValues({
    ...threeBioMetadata,
    profile: {
      ...profile,
      avatar: tombstones.has('profile.avatar')
        ? undefined
        : (profile?.avatar ?? nativeMetadata?.picture ?? undefined),
      coverPicture: tombstones.has('profile.coverPicture')
        ? undefined
        : (profile?.coverPicture ?? nativeMetadata?.coverPicture ?? undefined),
      linksPanelBackground: tombstones.has('profile.linksPanelBackground')
        ? undefined
        : profile?.linksPanelBackground,
      name: tombstones.has('profile.name')
        ? null
        : (profile?.name ?? nativeMetadata?.name),
      bio: tombstones.has('profile.bio')
        ? null
        : (profile?.bio ?? nativeMetadata?.bio),
      socialLinks: tombstones.has('profile.socialLinks')
        ? undefined
        : profile?.socialLinks,
      links: tombstones.has('profile.links') ? undefined : profile?.links,
    },
  });
};

export const getPersistedThreeBioDirtyFields = (
  dirtyFields: FieldNamesMarkedBoolean<MetadataFormValues>,
): PersistedThreeBioDirtyFields => ({
  name: Boolean(dirtyFields.name),
  bio: Boolean(dirtyFields.bio),
  socialLinks: Boolean(dirtyFields.socialLinks),
  links: Boolean(dirtyFields.links),
  theme: Boolean(dirtyFields.theme),
  displayStatistics: Boolean(dirtyFields.displayStatistics),
  displayBranding: Boolean(dirtyFields.displayBranding),
});
