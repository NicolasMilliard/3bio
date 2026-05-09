import { INBIO_ATTRIBUTE_KEY } from '@/constants';
import { type InBioMetadata } from '@/schemas/inBioMetadata.schema';

export const getInBioProfile = (
  attributes: { key: string; value: unknown }[] | undefined,
) => {
  const rawInBioMetadata = attributes?.find(
    (attribute) => attribute.key === INBIO_ATTRIBUTE_KEY,
  )?.value;

  if (typeof rawInBioMetadata === 'string') {
    try {
      return (JSON.parse(rawInBioMetadata) as InBioMetadata | undefined)
        ?.profile;
    } catch {
      return undefined;
    }
  }

  return (rawInBioMetadata as InBioMetadata | undefined)?.profile;
};
