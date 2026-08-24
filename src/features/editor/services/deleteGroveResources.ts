import {
  StorageClient,
  type DeleteResponse,
  type Signer,
} from '@lens-chain/storage-client';

import {
  normalizeGroveStorageKey,
} from '../helpers/groveResources';
import type { GroveManagedResourceRecord } from './groveManagedResourceManifest';

export type GroveResourceDeletionResult =
  | {
      status: 'deleted';
      resource: GroveManagedResourceRecord;
    }
  | {
      status: 'not-deleted';
      resource: GroveManagedResourceRecord;
    }
  | {
      status: 'failed';
      resource: GroveManagedResourceRecord;
      error: unknown;
    };

export type GroveResourceDeletionSummary = {
  results: GroveResourceDeletionResult[];
  deleted: GroveManagedResourceRecord[];
  retained: GroveManagedResourceRecord[];
};

type DeleteGroveResourcesDependencies = {
  deleteResource: (
    storageKey: string,
    signer: Signer,
  ) => Promise<DeleteResponse>;
};

type DeleteGroveResourcesInput = {
  resources: Iterable<GroveManagedResourceRecord>;
  signer: Signer;
  dependencies?: DeleteGroveResourcesDependencies;
};

const storageClient = StorageClient.create();

const defaultDependencies: DeleteGroveResourcesDependencies = {
  deleteResource: (storageKey, signer) =>
    storageClient.delete(storageKey, signer),
};

/**
 * Attempts deletions sequentially so wallet message requests do not race. A
 * failed resource never prevents later resources from being attempted.
 */
export const deleteGroveResourcesBestEffort = async ({
  resources,
  signer,
  dependencies = defaultDependencies,
}: DeleteGroveResourcesInput): Promise<GroveResourceDeletionSummary> => {
  const resourcesByKey = new Map<string, GroveManagedResourceRecord>();

  for (const resource of resources) {
    const storageKey = normalizeGroveStorageKey(resource.storageKey);

    if (storageKey && !resourcesByKey.has(storageKey)) {
      resourcesByKey.set(storageKey, { ...resource, storageKey });
    }
  }

  const results: GroveResourceDeletionResult[] = [];

  for (const resource of resourcesByKey.values()) {
    try {
      const response = await dependencies.deleteResource(
        resource.storageKey,
        signer,
      );

      results.push(
        response.success
          ? { status: 'deleted', resource }
          : { status: 'not-deleted', resource },
      );
    } catch (error) {
      results.push({ status: 'failed', resource, error });
    }
  }

  return {
    results,
    deleted: results.flatMap((result) =>
      result.status === 'deleted' ? [result.resource] : [],
    ),
    retained: results.flatMap((result) =>
      result.status === 'deleted' ? [] : [result.resource],
    ),
  };
};
