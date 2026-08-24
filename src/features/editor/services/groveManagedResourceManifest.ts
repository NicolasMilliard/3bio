import {
  normalizeGroveStorageKey,
  type GroveResourceReferenceDiff,
} from '../helpers/groveResources';

export const GROVE_MANAGED_RESOURCE_MANIFEST_VERSION = 1 as const;

const GROVE_MANAGED_RESOURCE_STORAGE_PREFIX = '3bio:grove-managed-resources';

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export type GroveManagedResourceKind = 'image' | 'metadata';
export type GroveManagedResourceState = 'pending' | 'published' | 'orphaned';

export type GroveManagedResourceRecord = {
  storageKey: string;
  recordId: string;
  kind: GroveManagedResourceKind;
  state: GroveManagedResourceState;
  recordedAt: number;
  publishedAt?: number;
};

export type GroveManagedResourceManifest = {
  version: typeof GROVE_MANAGED_RESOURCE_MANIFEST_VERSION;
  accountAddress: string;
  revision: number;
  activeMetadataKey: string | null;
  activeReferenceKeys: string[];
  resources: GroveManagedResourceRecord[];
  updatedAt: number;
};

export type GroveManifestStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>;

export type GroveManifestFailureReason =
  | 'invalid-account'
  | 'storage-unavailable'
  | 'storage-read-failed'
  | 'invalid-manifest'
  | 'storage-write-failed'
  | 'resource-not-managed'
  | 'resource-kind-conflict';

export type GroveManifestReadResult =
  | {
      ok: true;
      manifest: GroveManagedResourceManifest;
    }
  | {
      ok: false;
      reason: GroveManifestFailureReason;
    };

type GroveManifestMutationOptions = {
  storage?: GroveManifestStorage | null;
  now?: () => number;
  createRecordId?: () => string;
};

type GroveManagedResourceInput = {
  storageKey: string;
  kind: GroveManagedResourceKind;
};

type RecordManagedGroveResourcesInput = GroveManifestMutationOptions & {
  accountAddress: string;
  resources: Iterable<GroveManagedResourceInput>;
};

type MarkGrovePublicationConfirmedInput = GroveManifestMutationOptions & {
  accountAddress: string;
  metadataKey: string;
  referenceKeys: Iterable<string>;
};

type CompareManagedGroveResourcesInput = GroveManifestMutationOptions & {
  accountAddress: string;
  resources: Iterable<GroveManagedResourceRecord>;
};

export type GroveManifestRecordResult =
  | {
      ok: true;
      manifest: GroveManagedResourceManifest;
      recorded: GroveManagedResourceRecord[];
    }
  | {
      ok: false;
      reason: GroveManifestFailureReason;
    };

export type GroveManifestConfirmationResult =
  | {
      ok: true;
      manifest: GroveManagedResourceManifest;
      previousActiveMetadataKey: string | null;
      referenceDiff: GroveResourceReferenceDiff;
    }
  | {
      ok: false;
      reason: GroveManifestFailureReason;
    };

export type GroveManifestClearResult =
  | {
      ok: true;
      manifest: GroveManagedResourceManifest;
      cleared: GroveManagedResourceRecord[];
    }
  | {
      ok: false;
      reason: GroveManifestFailureReason;
    };

let fallbackRecordSequence = 0;

const defaultNow = () => Date.now();

const defaultCreateRecordId = () => {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) return randomUuid;

  fallbackRecordSequence += 1;

  return `${Date.now().toString(36)}-${fallbackRecordSequence.toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const normalizeAccountAddress = (accountAddress: string) =>
  EVM_ADDRESS_PATTERN.test(accountAddress)
    ? accountAddress.toLowerCase()
    : null;

export const getGroveManagedResourceManifestStorageKey = (
  accountAddress: string,
) => {
  const normalizedAccountAddress = normalizeAccountAddress(accountAddress);

  return normalizedAccountAddress
    ? `${GROVE_MANAGED_RESOURCE_STORAGE_PREFIX}:v${GROVE_MANAGED_RESOURCE_MANIFEST_VERSION}:${normalizedAccountAddress}`
    : null;
};

const resolveStorage = (storage: GroveManifestStorage | null | undefined) => {
  if (storage !== undefined) return storage;
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const emptyManifest = (
  accountAddress: string,
): GroveManagedResourceManifest => ({
  version: GROVE_MANAGED_RESOURCE_MANIFEST_VERSION,
  accountAddress,
  revision: 0,
  activeMetadataKey: null,
  activeReferenceKeys: [],
  resources: [],
  updatedAt: 0,
});

const isFiniteTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const parseManagedResource = (
  value: unknown,
): GroveManagedResourceRecord | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<GroveManagedResourceRecord>;
  const storageKey = normalizeGroveStorageKey(candidate.storageKey);

  if (
    !storageKey ||
    typeof candidate.recordId !== 'string' ||
    candidate.recordId.length === 0 ||
    candidate.recordId.length > 256 ||
    (candidate.kind !== 'image' && candidate.kind !== 'metadata') ||
    (candidate.state !== 'pending' &&
      candidate.state !== 'published' &&
      candidate.state !== 'orphaned') ||
    !isFiniteTimestamp(candidate.recordedAt) ||
    (candidate.publishedAt !== undefined &&
      !isFiniteTimestamp(candidate.publishedAt))
  ) {
    return null;
  }

  return {
    storageKey,
    recordId: candidate.recordId,
    kind: candidate.kind,
    state: candidate.state,
    recordedAt: candidate.recordedAt,
    ...(candidate.publishedAt === undefined
      ? {}
      : { publishedAt: candidate.publishedAt }),
  };
};

const parseManifest = (
  value: unknown,
  accountAddress: string,
): GroveManagedResourceManifest | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<GroveManagedResourceManifest>;

  if (
    candidate.version !== GROVE_MANAGED_RESOURCE_MANIFEST_VERSION ||
    candidate.accountAddress !== accountAddress ||
    !Number.isSafeInteger(candidate.revision) ||
    (candidate.revision ?? -1) < 0 ||
    !isFiniteTimestamp(candidate.updatedAt) ||
    !Array.isArray(candidate.resources) ||
    !Array.isArray(candidate.activeReferenceKeys)
  ) {
    return null;
  }

  const resources = new Map<string, GroveManagedResourceRecord>();

  for (const value of candidate.resources) {
    const resource = parseManagedResource(value);

    if (!resource) return null;
    resources.set(resource.storageKey, resource);
  }

  const activeMetadataKey =
    candidate.activeMetadataKey === null
      ? null
      : normalizeGroveStorageKey(candidate.activeMetadataKey);

  if (candidate.activeMetadataKey !== null && !activeMetadataKey) return null;

  const activeReferenceKeys = new Set<string>();

  for (const value of candidate.activeReferenceKeys) {
    const storageKey = normalizeGroveStorageKey(value);

    if (!storageKey) return null;
    activeReferenceKeys.add(storageKey);
  }

  if (activeMetadataKey) {
    const activeMetadata = resources.get(activeMetadataKey);

    if (
      !activeMetadata ||
      activeMetadata.kind !== 'metadata' ||
      activeMetadata.state !== 'published'
    ) {
      return null;
    }
  }

  for (const storageKey of activeReferenceKeys) {
    const resource = resources.get(storageKey);

    if (!resource || resource.state !== 'published') return null;
  }

  return {
    version: GROVE_MANAGED_RESOURCE_MANIFEST_VERSION,
    accountAddress,
    revision: candidate.revision ?? 0,
    activeMetadataKey,
    activeReferenceKeys: [...activeReferenceKeys].sort(),
    resources: [...resources.values()].sort((left, right) =>
      left.storageKey.localeCompare(right.storageKey),
    ),
    updatedAt: candidate.updatedAt ?? 0,
  };
};

export const readGroveManagedResourceManifest = ({
  accountAddress,
  storage,
}: {
  accountAddress: string;
  storage?: GroveManifestStorage | null;
}): GroveManifestReadResult => {
  const normalizedAccountAddress = normalizeAccountAddress(accountAddress);

  if (!normalizedAccountAddress) {
    return { ok: false, reason: 'invalid-account' };
  }

  const resolvedStorage = resolveStorage(storage);

  if (!resolvedStorage) {
    return { ok: false, reason: 'storage-unavailable' };
  }

  const storageKey = getGroveManagedResourceManifestStorageKey(
    normalizedAccountAddress,
  );
  let rawManifest: string | null;

  if (!storageKey) return { ok: false, reason: 'invalid-account' };

  try {
    rawManifest = resolvedStorage.getItem(storageKey);
  } catch {
    return { ok: false, reason: 'storage-read-failed' };
  }

  if (rawManifest === null) {
    return {
      ok: true,
      manifest: emptyManifest(normalizedAccountAddress),
    };
  }

  try {
    const manifest = parseManifest(
      JSON.parse(rawManifest) as unknown,
      normalizedAccountAddress,
    );

    return manifest
      ? { ok: true, manifest }
      : { ok: false, reason: 'invalid-manifest' };
  } catch {
    return { ok: false, reason: 'invalid-manifest' };
  }
};

const persistManifest = (
  manifest: GroveManagedResourceManifest,
  storage: GroveManifestStorage | null | undefined,
): boolean => {
  const resolvedStorage = resolveStorage(storage);
  const storageKey = getGroveManagedResourceManifestStorageKey(
    manifest.accountAddress,
  );

  if (!resolvedStorage || !storageKey) return false;

  try {
    if (
      manifest.resources.length === 0 &&
      manifest.activeMetadataKey === null &&
      manifest.activeReferenceKeys.length === 0
    ) {
      resolvedStorage.removeItem(storageKey);
    } else {
      resolvedStorage.setItem(storageKey, JSON.stringify(manifest));
    }

    return true;
  } catch {
    return false;
  }
};

const nextManifest = (
  manifest: GroveManagedResourceManifest,
  resources: GroveManagedResourceRecord[],
  now: number,
  activeMetadataKey = manifest.activeMetadataKey,
  activeReferenceKeys = manifest.activeReferenceKeys,
): GroveManagedResourceManifest => ({
  ...manifest,
  revision: manifest.revision + 1,
  activeMetadataKey,
  activeReferenceKeys: [...new Set(activeReferenceKeys)].sort(),
  resources: [...resources].sort((left, right) =>
    left.storageKey.localeCompare(right.storageKey),
  ),
  updatedAt: now,
});

export const recordManagedGroveResources = ({
  accountAddress,
  resources,
  storage,
  now = defaultNow,
  createRecordId = defaultCreateRecordId,
}: RecordManagedGroveResourcesInput): GroveManifestRecordResult => {
  const current = readGroveManagedResourceManifest({
    accountAddress,
    storage,
  });

  if (!current.ok) return current;

  const inputs = new Map<string, GroveManagedResourceInput>();

  for (const resource of resources) {
    const storageKey = normalizeGroveStorageKey(resource.storageKey);

    if (!storageKey) continue;

    const existingInput = inputs.get(storageKey);

    if (existingInput && existingInput.kind !== resource.kind) {
      return { ok: false, reason: 'resource-kind-conflict' };
    }

    inputs.set(storageKey, { ...resource, storageKey });
  }

  if (inputs.size === 0) {
    return { ok: true, manifest: current.manifest, recorded: [] };
  }

  const recordedAt = now();
  const resourcesByKey = new Map(
    current.manifest.resources.map((resource) => [
      resource.storageKey,
      resource,
    ]),
  );
  const recorded: GroveManagedResourceRecord[] = [];

  for (const input of inputs.values()) {
    const existing = resourcesByKey.get(input.storageKey);

    if (existing && existing.kind !== input.kind) {
      return { ok: false, reason: 'resource-kind-conflict' };
    }

    const isActiveResource =
      current.manifest.activeMetadataKey === input.storageKey ||
      current.manifest.activeReferenceKeys.includes(input.storageKey);
    const resource: GroveManagedResourceRecord = {
      storageKey: input.storageKey,
      recordId: createRecordId(),
      kind: input.kind,
      state: isActiveResource ? (existing?.state ?? 'pending') : 'pending',
      recordedAt,
      ...(isActiveResource && existing?.publishedAt !== undefined
        ? { publishedAt: existing.publishedAt }
        : {}),
    };

    resourcesByKey.set(resource.storageKey, resource);
    recorded.push(resource);
  }

  const manifest = nextManifest(
    current.manifest,
    [...resourcesByKey.values()],
    recordedAt,
  );

  if (!persistManifest(manifest, storage)) {
    return { ok: false, reason: 'storage-write-failed' };
  }

  return { ok: true, manifest, recorded };
};

const normalizeReferenceKeys = (values: Iterable<string>) => {
  const keys = new Set<string>();

  for (const value of values) {
    const storageKey = normalizeGroveStorageKey(value);

    if (storageKey) keys.add(storageKey);
  }

  return keys;
};

export const markGrovePublicationConfirmed = ({
  accountAddress,
  metadataKey,
  referenceKeys,
  storage,
  now = defaultNow,
  createRecordId = defaultCreateRecordId,
}: MarkGrovePublicationConfirmedInput): GroveManifestConfirmationResult => {
  const current = readGroveManagedResourceManifest({
    accountAddress,
    storage,
  });

  if (!current.ok) return current;

  const normalizedMetadataKey = normalizeGroveStorageKey(metadataKey);

  if (!normalizedMetadataKey) {
    return { ok: false, reason: 'resource-not-managed' };
  }

  const resourcesByKey = new Map(
    current.manifest.resources.map((resource) => [
      resource.storageKey,
      resource,
    ]),
  );
  const metadata = resourcesByKey.get(normalizedMetadataKey);

  if (!metadata) return { ok: false, reason: 'resource-not-managed' };
  if (metadata.kind !== 'metadata') {
    return { ok: false, reason: 'resource-kind-conflict' };
  }

  const confirmedAt = now();
  const managedReferenceKeys = new Set<string>();

  for (const storageKey of normalizeReferenceKeys(referenceKeys)) {
    if (storageKey === normalizedMetadataKey) continue;

    if (resourcesByKey.has(storageKey)) {
      managedReferenceKeys.add(storageKey);
    }
  }

  const publishedKeys = new Set([
    normalizedMetadataKey,
    ...managedReferenceKeys,
  ]);

  for (const storageKey of publishedKeys) {
    const resource = resourcesByKey.get(storageKey);

    if (!resource) continue;

    resourcesByKey.set(storageKey, {
      ...resource,
      recordId: createRecordId(),
      state: 'published',
      publishedAt: confirmedAt,
    });
  }

  const previousReferences = current.manifest.activeReferenceKeys;
  const nextReferences = [...managedReferenceKeys];
  const previous = new Set(previousReferences);
  const next = new Set(nextReferences);
  const referenceDiff: GroveResourceReferenceDiff = {
    added: [...next].filter((key) => !previous.has(key)).sort(),
    removed: [...previous].filter((key) => !next.has(key)).sort(),
    retained: [...previous].filter((key) => next.has(key)).sort(),
  };
  const manifest = nextManifest(
    current.manifest,
    [...resourcesByKey.values()],
    confirmedAt,
    normalizedMetadataKey,
    nextReferences,
  );

  if (!persistManifest(manifest, storage)) {
    return { ok: false, reason: 'storage-write-failed' };
  }

  return {
    ok: true,
    manifest,
    previousActiveMetadataKey: current.manifest.activeMetadataKey,
    referenceDiff,
  };
};

const compareResourceRecords = (
  left: GroveManagedResourceRecord,
  right: GroveManagedResourceRecord,
) => left.storageKey === right.storageKey && left.recordId === right.recordId;

export const markManagedGroveResourcesOrphaned = ({
  accountAddress,
  resources,
  storage,
  now = defaultNow,
  createRecordId = defaultCreateRecordId,
}: CompareManagedGroveResourcesInput): GroveManifestRecordResult => {
  const current = readGroveManagedResourceManifest({
    accountAddress,
    storage,
  });

  if (!current.ok) return current;

  const expectedByKey = new Map(
    [...resources].map((resource) => [resource.storageKey, resource]),
  );
  const changedAt = now();
  const orphaned: GroveManagedResourceRecord[] = [];
  const nextResources = current.manifest.resources.map((resource) => {
    const expected = expectedByKey.get(resource.storageKey);

    if (
      !expected ||
      !compareResourceRecords(resource, expected) ||
      resource.state !== 'pending'
    ) {
      return resource;
    }

    const nextResource: GroveManagedResourceRecord = {
      ...resource,
      recordId: createRecordId(),
      state: 'orphaned',
    };

    orphaned.push(nextResource);
    return nextResource;
  });

  if (orphaned.length === 0) {
    return { ok: true, manifest: current.manifest, recorded: [] };
  }

  const manifest = nextManifest(current.manifest, nextResources, changedAt);

  if (!persistManifest(manifest, storage)) {
    return { ok: false, reason: 'storage-write-failed' };
  }

  return { ok: true, manifest, recorded: orphaned };
};

/**
 * Pending records are always protected. Metadata documents are also retained:
 * Lens account data does not expose the active document's Grove storage key,
 * so the browser cannot prove that an apparently superseded key is no longer
 * live. A confirmation timeout must therefore leave an image upload pending
 * until a later reconciliation explicitly publishes or orphans it.
 */
export const selectDeletableManagedGroveResources = ({
  manifest,
  protectedReferenceKeys = [],
}: {
  manifest: GroveManagedResourceManifest;
  protectedReferenceKeys?: Iterable<string>;
}) => {
  const protectedKeys = normalizeReferenceKeys(protectedReferenceKeys);

  if (manifest.activeMetadataKey) {
    protectedKeys.add(manifest.activeMetadataKey);
  }

  for (const storageKey of manifest.activeReferenceKeys) {
    protectedKeys.add(storageKey);
  }

  return manifest.resources.filter(
    (resource) =>
      resource.kind === 'image' &&
      resource.state !== 'pending' &&
      !protectedKeys.has(resource.storageKey),
  );
};

export const compareAndClearManagedGroveResources = ({
  accountAddress,
  resources,
  storage,
  now = defaultNow,
}: CompareManagedGroveResourcesInput): GroveManifestClearResult => {
  const current = readGroveManagedResourceManifest({
    accountAddress,
    storage,
  });

  if (!current.ok) return current;

  const expectedByKey = new Map(
    [...resources].map((resource) => [resource.storageKey, resource]),
  );
  const cleared: GroveManagedResourceRecord[] = [];
  const remaining = current.manifest.resources.filter((resource) => {
    const expected = expectedByKey.get(resource.storageKey);
    const shouldClear =
      !!expected && compareResourceRecords(resource, expected);

    if (shouldClear) cleared.push(resource);

    return !shouldClear;
  });

  if (cleared.length === 0) {
    return { ok: true, manifest: current.manifest, cleared: [] };
  }

  const remainingKeys = new Set(
    remaining.map((resource) => resource.storageKey),
  );
  const activeMetadataKey =
    current.manifest.activeMetadataKey &&
    remainingKeys.has(current.manifest.activeMetadataKey)
      ? current.manifest.activeMetadataKey
      : null;
  const activeReferenceKeys = current.manifest.activeReferenceKeys.filter(
    (storageKey) => remainingKeys.has(storageKey),
  );
  const manifest = nextManifest(
    current.manifest,
    remaining,
    now(),
    activeMetadataKey,
    activeReferenceKeys,
  );

  if (!persistManifest(manifest, storage)) {
    return { ok: false, reason: 'storage-write-failed' };
  }

  return { ok: true, manifest, cleared };
};
