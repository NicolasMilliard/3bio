import {
  THREE_BIO_DEFAULT_THEME,
  THREE_BIO_THEME_NAMES,
} from '@/constants/themes';
import { MetadataAttributeType } from '@lens-protocol/metadata';
import { z } from 'zod';

const linkSchema = z.object({
  type: z.enum([
    MetadataAttributeType.BOOLEAN,
    MetadataAttributeType.DATE,
    MetadataAttributeType.NUMBER,
    MetadataAttributeType.JSON,
    MetadataAttributeType.STRING,
  ]),
  key: z.string(),
  value: z.url(),
});

export type LensLink = z.infer<typeof linkSchema>;

export const profileSchema = z.object({
  coverPicture: z.url().optional(),
  avatar: z.url().optional(),
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  socialLinks: z.array(linkSchema).optional(),
  links: z.array(linkSchema).optional(),
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
    id: z.string().optional(),
    type: z.enum(['free', 'premium']).default('free'),
  }),
});

export const threeBioMetadataSchema = z.object({
  profile: profileSchema.optional(),
  theme: themeSchema.optional(),
  settings: settingsSchema.optional(),
});

export type ThreeBioMetadata = z.infer<typeof threeBioMetadataSchema>;
