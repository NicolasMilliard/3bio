import { SOCIAL_MAP, type PlatformName } from '@/constants/platforms';
import { httpUrlSchema } from '@/schemas/httpUrl.schema';
import { threeBioThemeNameSchema } from '@/schemas/threeBioMetadata.schema';
import { z } from 'zod';

const optionalPreviewUrl = z
  .union([z.url(), z.literal('')])
  .nullable()
  .optional();
const optionalHttpUrl = z
  .union([z.literal(''), httpUrlSchema])
  .nullable()
  .optional();

export const socialLinkSchema = z
  .object({
    platform: z.string(),
    url: optionalHttpUrl,
  })
  .superRefine(({ platform, url }, context) => {
    if (!url) return;

    const socialPlatform = SOCIAL_MAP[platform as PlatformName];

    if (!socialPlatform?.validateUrl(url)) {
      context.addIssue({
        code: 'custom',
        path: ['url'],
        message: socialPlatform
          ? `Enter a valid ${socialPlatform.label} profile URL.`
          : 'Choose a supported social platform.',
      });
    }
  });

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
