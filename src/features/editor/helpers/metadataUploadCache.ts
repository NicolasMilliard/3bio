import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import type { Account } from '@lens-protocol/react';

export const getMetadataUploadCacheKey = (
  previousMetadata: Account['metadata'],
  nextThreeBioMetadata: ThreeBioMetadata,
) =>
  JSON.stringify({
    previousMetadata,
    nextThreeBioMetadata,
  });
