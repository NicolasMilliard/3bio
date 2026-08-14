import {
  LENS_METADATA_MAX_ATTRIBUTES,
  THREEBIO_ATTRIBUTE_KEY,
  THREE_BIO_METADATA_MAX_BYTES,
} from '@/constants';
import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import {
  account as createMetadata,
  MetadataAttributeType,
  type MetadataAttribute,
} from '@lens-protocol/metadata';
import {
  MetadataAttributeType as ApiMetadataAttributeType,
  type Account,
} from '@lens-protocol/react';

type JsonAttribute = Extract<
  MetadataAttribute,
  { type: MetadataAttributeType.JSON }
>;

type ApiAttribute = NonNullable<Account['metadata']>['attributes'][number];

const normalizeAttribute = ({
  key,
  type,
  value,
}: ApiAttribute): MetadataAttribute => {
  switch (type) {
    case ApiMetadataAttributeType.Boolean:
      if (value !== 'true' && value !== 'false') {
        throw new Error(`Invalid Boolean metadata attribute "${key}"`);
      }
      return { key, type: MetadataAttributeType.BOOLEAN, value };

    case ApiMetadataAttributeType.Date:
      return { key, type: MetadataAttributeType.DATE, value };

    case ApiMetadataAttributeType.Number:
      return { key, type: MetadataAttributeType.NUMBER, value };

    case ApiMetadataAttributeType.String:
      return { key, type: MetadataAttributeType.STRING, value };

    case ApiMetadataAttributeType.Json:
      return { key, type: MetadataAttributeType.JSON, value };

    default:
      throw new Error(`Unsupported metadata attribute type: ${String(type)}`);
  }
};

export const formatMetadataBeforeUpload = (
  account: Pick<Account, 'metadata'>,
  threeBioMetadata: ThreeBioMetadata,
) => {
  const prevMetadata = account.metadata;
  const previousAttributes = prevMetadata?.attributes ?? [];

  if (previousAttributes.length > LENS_METADATA_MAX_ATTRIBUTES) {
    throw new RangeError(
      `Account metadata cannot contain more than ${LENS_METADATA_MAX_ATTRIBUTES} attributes.`,
    );
  }

  const serializedThreeBioMetadata = JSON.stringify(threeBioMetadata);

  if (
    new TextEncoder().encode(serializedThreeBioMetadata).byteLength >
    THREE_BIO_METADATA_MAX_BYTES
  ) {
    throw new RangeError(
      `3bio metadata cannot exceed ${THREE_BIO_METADATA_MAX_BYTES} bytes.`,
    );
  }

  const nextAttributes = previousAttributes
    .filter(({ key }) => key !== THREEBIO_ATTRIBUTE_KEY)
    .map(normalizeAttribute);

  nextAttributes.push({
    key: THREEBIO_ATTRIBUTE_KEY,
    type: MetadataAttributeType.JSON,
    value: serializedThreeBioMetadata,
  } satisfies JsonAttribute);

  if (nextAttributes.length > LENS_METADATA_MAX_ATTRIBUTES) {
    throw new RangeError(
      `Account metadata cannot contain more than ${LENS_METADATA_MAX_ATTRIBUTES} attributes.`,
    );
  }

  // This is a new metadata document, so the composer generates a fresh id.
  return createMetadata({
    name: prevMetadata?.name ?? undefined,
    bio: prevMetadata?.bio ?? undefined,
    picture: prevMetadata?.picture ?? undefined,
    coverPicture: prevMetadata?.coverPicture ?? undefined,
    attributes: nextAttributes,
  });
};
