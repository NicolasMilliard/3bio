import { z } from 'zod';

export const httpUrlSchema = z.url().refine(
  (value) => {
    const protocol = new URL(value).protocol;

    return protocol === 'http:' || protocol === 'https:';
  },
  { message: 'URL must use HTTP or HTTPS' },
);
