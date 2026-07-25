import { THREE_BIO_ORIGIN } from '@/constants/social';
import { z } from 'zod';

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const profileHosts = Array.from(
  new Set(['3bio.social', 'www.3bio.social', new URL(THREE_BIO_ORIGIN).host]),
);
const profileUrlPrefix = new RegExp(
  `^(?:https?://)?(?:${profileHosts.map(escapeRegExp).join('|')})(?=/|$)/?`,
  'i',
);

export const normalizeProfilePath = (value: string) =>
  value
    .trim()
    .replace(profileUrlPrefix, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

export const profileCheckingFormSchema = z.object({
  link: z
    .string()
    .trim()
    .transform(normalizeProfilePath)
    .refine((value) => value.length > 0, {
      message: 'Enter your Lens handle.',
    })
    .refine(
      (value) => /^[a-zA-Z0-9._-]+$/.test(value) && /[a-zA-Z0-9]/.test(value),
      {
        message: 'Use only letters, numbers, dots, underscores, or hyphens.',
      },
    ),
});

export type ProfileCheckingFormValues = z.infer<
  typeof profileCheckingFormSchema
>;
