import { httpUrlSchema } from '@/schemas/httpUrl.schema';
import { threeBioThemeNameSchema } from '@/schemas/threeBioMetadata.schema';
import { z } from 'zod';

const optionalPreviewUrl = z
  .union([z.url(), z.literal('')])
  .nullable()
  .optional();
const optionalHttpUrl = z
  .union([httpUrlSchema, z.literal('')])
  .nullable()
  .optional();

export const socialLinkSchema = z.object({
  platform: z.string(),
  url: optionalHttpUrl,
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const metadataFormSchema = z.object({
  avatar: z.object({
    file: z.instanceof(File).optional(),
    preview: optionalPreviewUrl,
  }),
  coverPicture: z.object({
    file: z.instanceof(File).optional(),
    preview: optionalPreviewUrl,
  }),
  name: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  links: z.array(httpUrlSchema).optional(),
  displayStatistics: z.boolean().optional(),
  displayBranding: z.boolean().optional(),
  theme: threeBioThemeNameSchema,
});

export type MetadataFormValues = z.infer<typeof metadataFormSchema>;
