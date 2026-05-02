import { INBIO_ATTRIBUTE_KEY } from '@/constants';
import type { InBioMetadata } from '@/schemas/inBioMetadata.schema';
import {
  account as createMetadata,
  MetadataAttributeType,
  type MetadataAttribute,
} from '@lens-protocol/metadata';
import { type Account } from '@lens-protocol/react';

type JsonAttribute = Extract<
  MetadataAttribute,
  { type: MetadataAttributeType.JSON }
>;

const upsertAttribute = (
  attributes: MetadataAttribute[],
  key: string,
  value: string,
) => [
  ...attributes.filter((a) => a.key !== key),
  {
    key,
    type: MetadataAttributeType.JSON,
    value,
  } satisfies JsonAttribute,
];

export const formatMetadataBeforeUpload = (
  account: Account,
  inBioMetadata: InBioMetadata,
) => {
  const prevMetadata = account.metadata;
  const prevAttributes = prevMetadata?.attributes ?? [];

  const nextAttributes = upsertAttribute(
    prevAttributes,
    INBIO_ATTRIBUTE_KEY,
    JSON.stringify(inBioMetadata),
  );

  return createMetadata({
    attributes: nextAttributes,
  });
};
