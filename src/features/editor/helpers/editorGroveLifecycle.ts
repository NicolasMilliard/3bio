import type { SaveStage } from './saveErrorFeedback';
import {
  recordManagedGroveResources,
  type GroveManagedResourceKind,
  type GroveManagedResourceRecord,
} from '../services/groveManagedResourceManifest';
import type { MetadataUpdateFailure } from '../services/submitMetadataUpdate';

type RecordEditorGroveUploadDependencies = {
  recordManagedResources: typeof recordManagedGroveResources;
};

const defaultRecordDependencies: RecordEditorGroveUploadDependencies = {
  recordManagedResources: recordManagedGroveResources,
};

/**
 * Recording happens after Grove has already created the resource, so local
 * persistence failure must not turn an otherwise valid save into a new orphan.
 */
export const recordEditorGroveUpload = ({
  accountAddress,
  storageKey,
  kind,
  dependencies = defaultRecordDependencies,
}: {
  accountAddress: string;
  storageKey: string;
  kind: GroveManagedResourceKind;
  dependencies?: RecordEditorGroveUploadDependencies;
}): GroveManagedResourceRecord | null => {
  try {
    const result = dependencies.recordManagedResources({
      accountAddress,
      resources: [{ storageKey, kind }],
    });

    return result.ok && result.recorded.length === 1
      ? result.recorded[0]!
      : null;
  } catch {
    return null;
  }
};

export const isDefinitiveMetadataUpdateFailure = (
  failure: MetadataUpdateFailure,
) =>
  failure.kind !== 'confirmation-failed' &&
  failure.kind !== 'submission-unknown';

/**
 * Once transaction submission starts, an unexpected throw cannot prove that
 * no transaction was broadcast. Keep those uploads pending for reconciliation.
 */
export const shouldOrphanEditorUploadsAfterThrow = (stage: SaveStage) =>
  stage !== 'submitting-transaction' && stage !== 'confirming-transaction';
