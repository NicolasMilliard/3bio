import { THREE_BIO_METADATA_SCHEMA_VERSION } from '@/constants/metadata';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import {
  persistedThreeBioMetadataSchema,
  type ThreeBioMetadata,
} from '@/schemas/threeBioMetadata.schema';
import { toLinkAttributes, toSocialLinkAttributes } from './metadataAttributes';

type PersistedProfileFormValues = Pick<
  MetadataFormValues,
  | 'name'
  | 'bio'
  | 'socialLinks'
  | 'links'
  | 'theme'
  | 'displayStatistics'
  | 'displayBranding'
>;

export type PersistedThreeBioDirtyFields = Partial<
  Record<keyof PersistedProfileFormValues, boolean>
>;

export const buildPersistedThreeBioMetadata = ({
  current,
  values,
  avatarUri,
  coverPictureUri,
  linksPanelBackgroundUri,
  dirtyFields,
  updatedAt = new Date().toISOString(),
}: {
  current: ThreeBioMetadata;
  values: PersistedProfileFormValues;
  avatarUri: string | null | undefined;
  coverPictureUri: string | null | undefined;
  linksPanelBackgroundUri: string | null | undefined;
  dirtyFields?: PersistedThreeBioDirtyFields;
  updatedAt?: string;
}) => {
  const nextProfile = {
    ...current.profile,
  };
  const tombstones = new Set(current.tombstones ?? []);
  const shouldWrite = (field: keyof PersistedProfileFormValues) =>
    dirtyFields?.[field] ?? true;

  // Legacy nulls meant "fall back to Lens". Do not accidentally turn them
  // into v1 null tombstones while upgrading an otherwise unrelated edit.
  if (current.schemaVersion === undefined) {
    if (nextProfile.name === null) delete nextProfile.name;
    if (nextProfile.bio === null) delete nextProfile.bio;
  }

  const setText = (field: 'name' | 'bio', value: string | undefined) => {
    if (value === undefined) return;

    const path = `profile.${field}` as const;

    if (value === '') {
      delete nextProfile[field];
      tombstones.add(path);
      return;
    }

    nextProfile[field] = value;
    tombstones.delete(path);
  };

  setText('name', shouldWrite('name') ? values.name : undefined);
  setText('bio', shouldWrite('bio') ? values.bio : undefined);

  const setImage = (
    field: 'avatar' | 'coverPicture' | 'linksPanelBackground',
    value: string | null | undefined,
  ) => {
    const path = `profile.${field}` as const;

    if (value === undefined) return;

    if (value) {
      nextProfile[field] = value;
      tombstones.delete(path);
      return;
    }

    delete nextProfile[field];
    tombstones.add(path);
  };

  setImage('avatar', avatarUri);
  setImage('coverPicture', coverPictureUri);
  setImage('linksPanelBackground', linksPanelBackgroundUri);

  if (shouldWrite('socialLinks')) {
    nextProfile.socialLinks = toSocialLinkAttributes(values.socialLinks);
    tombstones.delete('profile.socialLinks');
  }

  if (shouldWrite('links')) {
    nextProfile.links = toLinkAttributes(values.links);
    tombstones.delete('profile.links');
  }

  const nextTheme = { ...current.theme };

  if (shouldWrite('theme')) {
    nextTheme.name = values.theme;
    tombstones.delete('theme.name');
  }
  if (shouldWrite('displayStatistics')) {
    nextTheme.displayStatistics = values.displayStatistics ?? true;
    tombstones.delete('theme.displayStatistics');
  }
  if (shouldWrite('displayBranding')) {
    nextTheme.displayBranding = values.displayBranding ?? true;
    tombstones.delete('theme.displayBranding');
  }

  return persistedThreeBioMetadataSchema.parse({
    schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
    updatedAt,
    profile: nextProfile,
    ...(Object.keys(nextTheme).length === 0 ? {} : { theme: nextTheme }),
    ...(current.settings === undefined ? {} : { settings: current.settings }),
    tombstones: [...tombstones],
  });
};
