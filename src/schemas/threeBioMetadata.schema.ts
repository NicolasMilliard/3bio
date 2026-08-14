import { MetadataAttributeType } from '@lens-protocol/metadata';
import { z } from 'zod';

import {
  THREE_BIO_BIO_MAX_LENGTH,
  THREE_BIO_LINK_KEY_MAX_LENGTH,
  THREE_BIO_LINKS_MAX_ITEMS,
  THREE_BIO_METADATA_MAX_TOMBSTONES,
  THREE_BIO_METADATA_SCHEMA_VERSION,
  THREE_BIO_NAME_MAX_LENGTH,
  THREE_BIO_SETTINGS_ID_MAX_LENGTH,
  THREE_BIO_SOCIAL_LINKS_MAX_ITEMS,
  THREE_BIO_TOMBSTONE_PATHS,
} from '../constants/metadata';
import {
  THREE_BIO_DEFAULT_THEME,
  THREE_BIO_THEME_NAMES,
} from '../constants/themes';
import { httpUrlSchema } from './httpUrl.schema';

const linkSchema = z.object({
  type: z.enum([
    MetadataAttributeType.BOOLEAN,
    MetadataAttributeType.DATE,
    MetadataAttributeType.NUMBER,
    MetadataAttributeType.JSON,
    MetadataAttributeType.STRING,
  ]),
  key: z.string().min(1).max(THREE_BIO_LINK_KEY_MAX_LENGTH),
  value: httpUrlSchema,
});

export type LensLink = z.infer<typeof linkSchema>;

export const profileSchema = z.object({
  coverPicture: httpUrlSchema.optional(),
  linksPanelBackground: httpUrlSchema.optional(),
  avatar: httpUrlSchema.optional(),
  name: z.string().max(THREE_BIO_NAME_MAX_LENGTH).nullable().optional(),
  bio: z.string().max(THREE_BIO_BIO_MAX_LENGTH).nullable().optional(),
  socialLinks: z
    .array(linkSchema)
    .max(THREE_BIO_SOCIAL_LINKS_MAX_ITEMS)
    .optional(),
  links: z.array(linkSchema).max(THREE_BIO_LINKS_MAX_ITEMS).optional(),
});

export type ThreeBioProfile = z.infer<typeof profileSchema>;

export const threeBioThemeNameSchema = z.enum(THREE_BIO_THEME_NAMES);

const themeSchema = z.object({
  name: threeBioThemeNameSchema.default(THREE_BIO_DEFAULT_THEME),
  displayStatistics: z.boolean().default(true),
  displayBranding: z.boolean().default(true),
});

export type ThreeBioTheme = z.infer<typeof themeSchema>;

const settingsSchema = z.object({
  subscription: z.object({
    id: z.string().max(THREE_BIO_SETTINGS_ID_MAX_LENGTH).optional(),
    type: z.enum(['free', 'premium']).default('free'),
  }),
});

const tombstonesSchema = z
  .array(z.enum(THREE_BIO_TOMBSTONE_PATHS))
  .max(THREE_BIO_METADATA_MAX_TOMBSTONES);
const metadataUpdatedAtSchema = z.iso.datetime({ offset: true }).regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  'Expected an RFC 3339 timestamp with seconds.',
);

const metadataStateShape = {
  profile: profileSchema.optional(),
  theme: themeSchema.optional(),
  settings: settingsSchema.optional(),
  tombstones: tombstonesSchema.optional(),
};

const legacyThreeBioMetadataSchema = z.object({
  schemaVersion: z.never().optional(),
  updatedAt: z.never().optional(),
  ...metadataStateShape,
});
const versionedThreeBioMetadataSchema = z.object({
  schemaVersion: z.literal(THREE_BIO_METADATA_SCHEMA_VERSION),
  updatedAt: metadataUpdatedAtSchema,
  ...metadataStateShape,
});

export const threeBioMetadataSchema = z.union([
  versionedThreeBioMetadataSchema,
  legacyThreeBioMetadataSchema,
]);

export type ThreeBioMetadata = z.infer<typeof threeBioMetadataSchema>;

export const persistedThreeBioMetadataSchema = versionedThreeBioMetadataSchema;

export type PersistedThreeBioMetadata = z.infer<
  typeof persistedThreeBioMetadataSchema
>;
