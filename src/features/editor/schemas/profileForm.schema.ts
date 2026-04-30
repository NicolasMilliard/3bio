import { z } from 'zod';

export const socialLinkSchema = z.object({
  type: z.string(),
  url: z.url().or(z.literal('')),
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const profileFormSchema = z.object({
  avatar: z.union([z.instanceof(File), z.url(), z.literal('')]).optional(),
  banner: z.object({
    file: z.instanceof(File).optional(),
    preview: z.string().optional(),
  }),
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  links: z.array(z.url()).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
