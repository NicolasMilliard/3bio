import { httpUrlSchema } from '@/schemas/httpUrl.schema';

export const isValidUrl = (value: string) => {
  return httpUrlSchema.safeParse(value).success;
};
