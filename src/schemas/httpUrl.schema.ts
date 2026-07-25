import { z } from 'zod';

export const httpUrlSchema = z
  .string()
  .trim()
  .pipe(
    z.url({
      protocol: /^https?$/,
      error: 'Enter a valid HTTP or HTTPS URL.',
    }),
  );
