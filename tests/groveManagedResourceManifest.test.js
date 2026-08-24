import { expect, test } from 'bun:test';

import {
  compareAndClearManagedGroveResources,
  getGroveManagedResourceManifestStorageKey,
  markGrovePublicationConfirmed,
  markManagedGroveResourcesOrphaned,
  readGroveManagedResourceManifest,
  recordManagedGroveResources,
  selectDeletableManagedGroveResources,
} from '../src/features/editor/services/groveManagedResourceManifest.ts';

const ACCOUNT = '0x5A384227B65FA093DEC03Ec34e111Db80A040615';
const OTHER_ACCOUNT = '0xde709f2102306220921060314715629080e2fb77';

const createStorage = () => {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
};

const createRuntime = (storage) => {
  let timestamp = 100;
  let recordId = 0;

  return {
    storage,
    now: () => timestamp++,
    createRecordId: () => `record-${++recordId}`,
  };
};

const record = (runtime, resources, accountAddress = ACCOUNT) =>
  recordManagedGroveResources({
    accountAddress,
    resources,
    ...runtime,
  });

test('uses versioned, normalized, account-scoped manifest keys', () => {
  expect(getGroveManagedResourceManifestStorageKey(ACCOUNT)).toBe(
    `3bio:grove-managed-resources:v1:${ACCOUNT.toLowerCase()}`,
  );
  expect(
    getGroveManagedResourceManifestStorageKey('not-an-address'),
  ).toBeNull();
});

test('fails closed when browser storage is unavailable or malformed', () => {
  expect(
    readGroveManagedResourceManifest({
      accountAddress: ACCOUNT,
      storage: null,
    }),
  ).toEqual({ ok: false, reason: 'storage-unavailable' });

  const storage = createStorage();
  const key = getGroveManagedResourceManifestStorageKey(ACCOUNT);
  storage.setItem(key, JSON.stringify({ version: 2 }));

  expect(
    readGroveManagedResourceManifest({ accountAddress: ACCOUNT, storage }),
  ).toEqual({ ok: false, reason: 'invalid-manifest' });

  const throwingStorage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {},
    removeItem: () => {},
  };

  expect(
    readGroveManagedResourceManifest({
      accountAddress: ACCOUNT,
      storage: throwingStorage,
    }),
  ).toEqual({ ok: false, reason: 'storage-read-failed' });
});

test('records pending resources per account and deduplicates by key', () => {
  const storage = createStorage();
  const runtime = createRuntime(storage);
  const result = record(runtime, [
    { storageKey: 'lens://avatar', kind: 'image' },
    { storageKey: 'avatar', kind: 'image' },
    { storageKey: 'metadata', kind: 'metadata' },
    { storageKey: 'invalid/key', kind: 'image' },
  ]);

  expect(result.ok).toBe(true);
  expect(result.recorded).toHaveLength(2);
  expect(result.manifest.resources).toMatchObject([
    { storageKey: 'avatar', kind: 'image', state: 'pending' },
    { storageKey: 'metadata', kind: 'metadata', state: 'pending' },
  ]);
  expect(result.manifest.revision).toBe(1);

  expect(
    readGroveManagedResourceManifest({
      accountAddress: OTHER_ACCOUNT,
      storage,
    }),
  ).toMatchObject({ ok: true, manifest: { resources: [] } });
});

test('keeps ambiguous pending uploads protected until reconciliation', () => {
  const storage = createStorage();
  const runtime = createRuntime(storage);
  const result = record(runtime, [
    { storageKey: 'ambiguous-metadata', kind: 'metadata' },
    { storageKey: 'ambiguous-image', kind: 'image' },
  ]);

  expect(result.ok).toBe(true);
  expect(
    selectDeletableManagedGroveResources({ manifest: result.manifest }),
  ).toEqual([]);
});

test('commits an active publication and exposes only superseded resources', () => {
  const storage = createStorage();
  const runtime = createRuntime(storage);
  const initial = record(runtime, [
    { storageKey: 'metadata-old', kind: 'metadata' },
    { storageKey: 'image-old', kind: 'image' },
    { storageKey: 'image-kept', kind: 'image' },
  ]);

  expect(initial.ok).toBe(true);

  const firstConfirmation = markGrovePublicationConfirmed({
    accountAddress: ACCOUNT,
    metadataKey: 'metadata-old',
    referenceKeys: ['image-old', 'image-kept'],
    ...runtime,
  });

  expect(firstConfirmation.ok).toBe(true);

  const uploaded = record(runtime, [
    { storageKey: 'metadata-new', kind: 'metadata' },
    { storageKey: 'image-new', kind: 'image' },
    { storageKey: 'unused-pending', kind: 'image' },
  ]);

  expect(uploaded.ok).toBe(true);
  expect(
    selectDeletableManagedGroveResources({ manifest: uploaded.manifest }),
  ).toEqual([]);

  const confirmation = markGrovePublicationConfirmed({
    accountAddress: ACCOUNT,
    metadataKey: 'metadata-new',
    referenceKeys: ['image-kept', 'image-new'],
    ...runtime,
  });

  expect(confirmation.ok).toBe(true);
  expect(confirmation.previousActiveMetadataKey).toBe('metadata-old');
  expect(confirmation.referenceDiff).toEqual({
    added: ['image-new'],
    removed: ['image-old'],
    retained: ['image-kept'],
  });
  expect(confirmation.manifest.activeMetadataKey).toBe('metadata-new');
  expect(confirmation.manifest.activeReferenceKeys).toEqual([
    'image-kept',
    'image-new',
  ]);

  expect(
    selectDeletableManagedGroveResources({
      manifest: confirmation.manifest,
    }).map((resource) => resource.storageKey),
  ).toEqual(['image-old']);

  expect(
    confirmation.manifest.resources.find(
      (resource) => resource.storageKey === 'unused-pending',
    ).state,
  ).toBe('pending');
});

test('compare-and-mark ignores a stale pending snapshot', () => {
  const storage = createStorage();
  const runtime = createRuntime(storage);
  const first = record(runtime, [
    { storageKey: 'pending-upload', kind: 'image' },
  ]);
  const second = record(runtime, [
    { storageKey: 'pending-upload', kind: 'image' },
  ]);

  expect(first.ok).toBe(true);
  expect(second.ok).toBe(true);

  const stale = markManagedGroveResourcesOrphaned({
    accountAddress: ACCOUNT,
    resources: first.recorded,
    ...runtime,
  });

  expect(stale.ok).toBe(true);
  expect(stale.recorded).toEqual([]);

  const current = markManagedGroveResourcesOrphaned({
    accountAddress: ACCOUNT,
    resources: second.recorded,
    ...runtime,
  });

  expect(current.ok).toBe(true);
  expect(current.recorded).toMatchObject([
    { storageKey: 'pending-upload', state: 'orphaned' },
  ]);
  expect(
    selectDeletableManagedGroveResources({ manifest: current.manifest }),
  ).toMatchObject([{ storageKey: 'pending-upload' }]);
});

test('compare-and-clear cannot erase a newly recorded resource', () => {
  const storage = createStorage();
  const runtime = createRuntime(storage);
  const first = record(runtime, [{ storageKey: 'image', kind: 'image' }]);
  const second = record(runtime, [{ storageKey: 'image', kind: 'image' }]);

  expect(first.ok).toBe(true);
  expect(second.ok).toBe(true);

  const staleClear = compareAndClearManagedGroveResources({
    accountAddress: ACCOUNT,
    resources: first.recorded,
    ...runtime,
  });

  expect(staleClear.ok).toBe(true);
  expect(staleClear.cleared).toEqual([]);
  expect(staleClear.manifest.resources).toHaveLength(1);

  const currentClear = compareAndClearManagedGroveResources({
    accountAddress: ACCOUNT,
    resources: second.recorded,
    ...runtime,
  });

  expect(currentClear.ok).toBe(true);
  expect(currentClear.cleared).toHaveLength(1);
  expect(currentClear.manifest.resources).toEqual([]);
});

test('does not infer ownership from protected references', () => {
  const storage = createStorage();
  const runtime = createRuntime(storage);
  const pending = record(runtime, [
    { storageKey: 'managed-orphan', kind: 'image' },
  ]);

  expect(pending.ok).toBe(true);

  const orphaned = markManagedGroveResourcesOrphaned({
    accountAddress: ACCOUNT,
    resources: pending.recorded,
    ...runtime,
  });

  expect(orphaned.ok).toBe(true);
  expect(
    selectDeletableManagedGroveResources({
      manifest: orphaned.manifest,
      protectedReferenceKeys: [
        'managed-orphan',
        'unmanaged-external-reference',
      ],
    }),
  ).toEqual([]);
  expect(orphaned.manifest.resources).toHaveLength(1);
});
