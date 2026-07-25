import { THREEBIO_ATTRIBUTE_KEY } from '@/constants';
import { parseThreeBioMetadata } from './parseThreeBioMetadata';

export const getThreeBioProfile = (
  attributes: { key: string; value: unknown }[] | undefined,
) => {
  const rawThreeBioMetadata = attributes?.find(
    (attribute) => attribute.key === THREEBIO_ATTRIBUTE_KEY,
  )?.value;

  return parseThreeBioMetadata(rawThreeBioMetadata)?.profile;
};
