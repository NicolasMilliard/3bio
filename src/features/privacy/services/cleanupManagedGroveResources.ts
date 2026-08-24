import type { Signer } from '@lens-chain/storage-client';

import {
  THREE_BIO_METADATA_MAX_BYTES,
  THREE_BIO_METADATA_TOTAL_CANDIDATE_BYTES,
} from '@/constants/metadata';
import { inspectGroveResourceReferences } from '@/features/editor/helpers/groveResources';
import { deleteGroveResourcesBestEffort } from '@/features/editor/services/deleteGroveResources';
import {
  compareAndClearManagedGroveResources,
  readGroveManagedResourceManifest,
  selectDeletableManagedGroveResources,
  type GroveManifestFailureReason,
  type GroveManifestStorage,
  type GroveManagedResourceRecord,
} from '@/features/editor/services/groveManagedResourceManifest';
import { readThreeBioMetadataAttributes } from '@/helpers';

export type ManagedGroveCleanupResult =
  | {
      ok: true;
      candidates: GroveManagedResourceRecord[];
      deleted: GroveManagedResourceRecord[];
      retained: GroveManagedResourceRecord[];
    }
  | {
      ok: false;
      reason:
        | GroveManifestFailureReason
        | 'metadata-inspection-failed'
        | 'unsupported-schema-version';
    }
  | {
      ok: false;
      reason: 'manifest-sync-failed';
      manifestFailure?: GroveManifestFailureReason;
      candidates: GroveManagedResourceRecord[];
      deleted: GroveManagedResourceRecord[];
      retained: GroveManagedResourceRecord[];
      manifestMayBeStale: true;
    };

type CleanupDependencies = {
  deleteResources: typeof deleteGroveResourcesBestEffort;
};

type LatestAccountMetadataVerification =
  { ok: true; metadata: unknown } | { ok: false };

const defaultDependencies: CleanupDependencies = {
  deleteResources: deleteGroveResourcesBestEffort,
};

type MetadataReferenceCollectionResult =
  | { ok: true; referenceKeys: string[] }
  | {
      ok: false;
      reason: 'metadata-inspection-failed' | 'unsupported-schema-version';
    };

const collectLatestMetadataReferenceKeys = (
  metadata: unknown,
): MetadataReferenceCollectionResult => {
  const directInspection = inspectGroveResourceReferences(metadata);

  if (!directInspection.inspectionComplete) {
    return { ok: false, reason: 'metadata-inspection-failed' };
  }

  const references = new Set(directInspection.referenceKeys);

  if (
    metadata &&
    typeof metadata === 'object' &&
    'attributes' in metadata &&
    Array.isArray(metadata.attributes)
  ) {
    const attributes = metadata.attributes as readonly {
      key?: unknown;
      type?: unknown;
      value?: unknown;
    }[];
    const threeBioState = readThreeBioMetadataAttributes(attributes);

    if (threeBioState.hasUnsupportedSchemaVersion) {
      return { ok: false, reason: 'unsupported-schema-version' };
    }

    const threeBioInspection = inspectGroveResourceReferences(
      threeBioState.metadata,
    );

    if (!threeBioInspection.inspectionComplete) {
      return { ok: false, reason: 'metadata-inspection-failed' };
    }

    for (const storageKey of threeBioInspection.referenceKeys) {
      references.add(storageKey);
    }

    let decodedBytes = 0;

    for (const attribute of attributes) {
      if (typeof attribute.value !== 'string') continue;

      const candidate = attribute.value.trim();
      const isJsonAttribute = attribute.type === 'JSON';
      const looksStructured =
        candidate.startsWith('{') || candidate.startsWith('[');

      if (!isJsonAttribute && !looksStructured) continue;

      const candidateBytes = new TextEncoder().encode(candidate).byteLength;
      decodedBytes += candidateBytes;

      if (
        candidateBytes > THREE_BIO_METADATA_MAX_BYTES ||
        decodedBytes > THREE_BIO_METADATA_TOTAL_CANDIDATE_BYTES
      ) {
        return { ok: false, reason: 'metadata-inspection-failed' };
      }

      try {
        const inspection = inspectGroveResourceReferences(
          JSON.parse(candidate) as unknown,
        );

        if (!inspection.inspectionComplete) {
          return { ok: false, reason: 'metadata-inspection-failed' };
        }

        for (const storageKey of inspection.referenceKeys) {
          references.add(storageKey);
        }
      } catch {
        // A declared or object/array-shaped JSON attribute that cannot be
        // inspected makes deletion unsafe. Retain every candidate.
        return { ok: false, reason: 'metadata-inspection-failed' };
      }
    }
  }

  return { ok: true, referenceKeys: [...references].sort() };
};

/**
 * Deletes only image resources recorded as app-managed and no longer
 * referenced by the latest composed Lens metadata. Pending and active images
 * remain protected. Metadata documents are never candidates because Lens does
 * not expose enough information to prove which Grove document is currently
 * indexed. Successful deletions are removed with compare-and-clear.
 */
export const cleanupManagedGroveResources = async ({
  accountAddress,
  latestAccountMetadata,
  signer,
  storage,
  revalidateLatestAccountMetadata,
  dependencies = defaultDependencies,
}: {
  accountAddress: string;
  latestAccountMetadata: unknown;
  signer: Signer;
  storage?: GroveManifestStorage | null;
  revalidateLatestAccountMetadata?: () => Promise<LatestAccountMetadataVerification>;
  dependencies?: CleanupDependencies;
}): Promise<ManagedGroveCleanupResult> => {
  const manifestResult = readGroveManagedResourceManifest({
    accountAddress,
    storage,
  });

  if (!manifestResult.ok) return manifestResult;

  const referenceCollection = collectLatestMetadataReferenceKeys(
    latestAccountMetadata,
  );

  if (!referenceCollection.ok) return referenceCollection;

  const candidates = selectDeletableManagedGroveResources({
    manifest: manifestResult.manifest,
    protectedReferenceKeys: referenceCollection.referenceKeys,
  });

  if (candidates.length === 0) {
    return { ok: true, candidates, deleted: [], retained: [] };
  }

  const deleted: GroveManagedResourceRecord[] = [];
  const retained: GroveManagedResourceRecord[] = [];

  for (const [index, candidate] of candidates.entries()) {
    let verifiedMetadata = latestAccountMetadata;

    if (revalidateLatestAccountMetadata) {
      let verification: LatestAccountMetadataVerification;

      try {
        verification = await revalidateLatestAccountMetadata();
      } catch {
        verification = { ok: false };
      }

      if (!verification.ok) {
        retained.push(...candidates.slice(index));
        break;
      }

      verifiedMetadata = verification.metadata;
    }

    const currentReferences =
      collectLatestMetadataReferenceKeys(verifiedMetadata);

    if (!currentReferences.ok) {
      retained.push(...candidates.slice(index));
      break;
    }

    const currentManifest = readGroveManagedResourceManifest({
      accountAddress,
      storage,
    });

    if (!currentManifest.ok) {
      retained.push(...candidates.slice(index));
      break;
    }

    const currentCandidate = selectDeletableManagedGroveResources({
      manifest: currentManifest.manifest,
      protectedReferenceKeys: currentReferences.referenceKeys,
    }).find(
      (resource) =>
        resource.storageKey === candidate.storageKey &&
        resource.recordId === candidate.recordId,
    );

    if (!currentCandidate) {
      retained.push(candidate);
      continue;
    }

    let deletion: Awaited<ReturnType<typeof deleteGroveResourcesBestEffort>>;

    try {
      deletion = await dependencies.deleteResources({
        resources: [currentCandidate],
        signer,
      });
    } catch {
      retained.push(...candidates.slice(index));
      break;
    }

    deleted.push(...deletion.deleted);
    retained.push(...deletion.retained);

    const clearResult = compareAndClearManagedGroveResources({
      accountAddress,
      resources: deletion.deleted,
      storage,
    });

    if (
      !clearResult.ok ||
      clearResult.cleared.length !== deletion.deleted.length
    ) {
      return {
        ok: false,
        reason: 'manifest-sync-failed',
        ...(!clearResult.ok ? { manifestFailure: clearResult.reason } : {}),
        candidates,
        deleted,
        retained: [...retained, ...candidates.slice(index + 1)],
        manifestMayBeStale: true,
      };
    }
  }

  return {
    ok: true,
    candidates,
    deleted,
    retained,
  };
};
