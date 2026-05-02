import { z } from 'zod';

const optionalUrl = z.union([z.url(), z.literal('')]).optional();

export const socialLinkSchema = z.object({
  platform: z.string(),
  url: optionalUrl,
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const profileFormSchema = z.object({
  avatar: z.object({
    file: z.instanceof(File).optional(),
    preview: optionalUrl,
  }),
  coverPicture: z.object({
    file: z.instanceof(File).optional(),
    preview: optionalUrl,
  }),
  name: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  links: z.array(z.url()).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
