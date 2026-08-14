import {
  THREE_BIO_BIO_MAX_LENGTH,
  THREE_BIO_LINKS_MAX_ITEMS,
  THREE_BIO_NAME_MAX_LENGTH,
  THREE_BIO_SOCIAL_LINKS_MAX_ITEMS,
  THREE_BIO_URL_MAX_LENGTH,
} from '@/constants/metadata';
import { SOCIAL_MAP, type PlatformName } from '@/constants/platforms';
import { httpUrlSchema } from '@/schemas/httpUrl.schema';
import { threeBioThemeNameSchema } from '@/schemas/threeBioMetadata.schema';
import { z } from 'zod';
import { imageUploadFileSchema } from './imageUpload.schema';

const urlLengthMessage = `URLs cannot exceed ${THREE_BIO_URL_MAX_LENGTH} characters.`;
const limitedHttpUrlSchema = z
  .string()
  .trim()
  .max(THREE_BIO_URL_MAX_LENGTH, urlLengthMessage)
  .pipe(httpUrlSchema);
const localImagePreviewUrlSchema = z
  .url({
    protocol: /^blob$/,
    error: 'Use an HTTP or HTTPS image, or upload a new image.',
  })
  .max(THREE_BIO_URL_MAX_LENGTH, urlLengthMessage);
const optionalPreviewUrl = z
  .union([limitedHttpUrlSchema, localImagePreviewUrlSchema, z.literal('')], {
    error: 'Use an HTTP or HTTPS image, or upload a new image.',
  })
  .nullable()
  .optional();
const optionalHttpUrl = z
  .union([z.literal(''), limitedHttpUrlSchema])
  .nullable()
  .optional();
const imageFormValueSchema = z
  .object({
    file: imageUploadFileSchema.optional(),
    preview: optionalPreviewUrl,
  })
  .superRefine(({ file, preview }, context) => {
    if (typeof preview === 'string' && preview.startsWith('blob:') && !file) {
      context.addIssue({
        code: 'custom',
        path: ['preview'],
        message: 'Choose the local image again before saving.',
      });
    }
  });

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

export const metadataFormSchema = z
  .object({
    _imageValidation: z.object({
      avatar: z.boolean(),
      coverPicture: z.boolean(),
      linksPanelBackground: z.boolean(),
    }),
    avatar: imageFormValueSchema,
    coverPicture: imageFormValueSchema,
    linksPanelBackground: imageFormValueSchema,
    name: z.string().max(THREE_BIO_NAME_MAX_LENGTH).optional(),
    bio: z.string().max(THREE_BIO_BIO_MAX_LENGTH).optional(),
    socialLinks: z.array(socialLinkSchema).optional(),
    links: z
      .array(limitedHttpUrlSchema)
      .max(THREE_BIO_LINKS_MAX_ITEMS)
      .optional(),
    displayStatistics: z.boolean().optional(),
    displayBranding: z.boolean().optional(),
    theme: threeBioThemeNameSchema,
  })
  .superRefine(({ socialLinks }, context) => {
    const activeSocialLinks =
      socialLinks?.filter(({ url }) => Boolean(url?.trim())).length ?? 0;

    if (activeSocialLinks > THREE_BIO_SOCIAL_LINKS_MAX_ITEMS) {
      context.addIssue({
        code: 'too_big',
        maximum: THREE_BIO_SOCIAL_LINKS_MAX_ITEMS,
        origin: 'array',
        inclusive: true,
        path: ['socialLinks'],
        message: `Add no more than ${THREE_BIO_SOCIAL_LINKS_MAX_ITEMS} social links.`,
      });
    }
  });

export type MetadataFormValues = z.infer<typeof metadataFormSchema>;
