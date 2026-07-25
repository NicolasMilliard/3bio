import {
  threeBioMetadataSchema,
  type ThreeBioMetadata,
} from '@/schemas/threeBioMetadata.schema';

export const parseThreeBioMetadata = (
  value: unknown,
): ThreeBioMetadata | undefined => {
  let parsedValue = value;

  if (typeof value === 'string') {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  const result = threeBioMetadataSchema.safeParse(parsedValue);

  return result.success ? result.data : undefined;
};
