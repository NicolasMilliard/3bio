import { z } from 'zod';

import { THREE_BIO_URL_MAX_LENGTH } from '../constants/metadata';

export const httpUrlSchema = z
  .string()
  .trim()
  .max(THREE_BIO_URL_MAX_LENGTH)
  .pipe(
    z.url({
      protocol: /^https?$/,
      error: 'Enter a valid HTTP or HTTPS URL.',
    }),
  );
