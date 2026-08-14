import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import type { Account } from '@lens-protocol/react';

export const getMetadataUploadCacheKey = (
  previousMetadata: Account['metadata'],
  nextThreeBioMetadata: ThreeBioMetadata,
) => {
  const stableThreeBioMetadata = { ...nextThreeBioMetadata };

  delete (stableThreeBioMetadata as { updatedAt?: unknown }).updatedAt;

  return JSON.stringify({
    previousMetadata,
    nextThreeBioMetadata: stableThreeBioMetadata,
  });
};
