import { z } from 'zod';

const linkSchema = z.object({
  key: z.string(),
  value: z.url(),
});

const profileSchema = z.object({
  coverPicture: z.url().optional(),
  avatar: z.url().optional(),
  name: z.string(),
  bio: z.string().optional(),
  socialLinks: z.array(linkSchema).optional(),
  links: z.array(linkSchema).optional(),
});

const themeSchema = z.object({
  name: z.enum(['default']).default('default'),
  displayStatistics: z.boolean().default(true),
  displayBranding: z.boolean().default(true),
});

const settingsSchema = z.object({
  subscription: z.object({
    id: z.string().optional(),
    type: z.enum(['free', 'premium']).default('free'),
  }),
});

export const metadataSchema = z.object({
  profile: profileSchema,
  theme: themeSchema,
  settings: settingsSchema,
});

export type Metadata = z.infer<typeof metadataSchema>;
