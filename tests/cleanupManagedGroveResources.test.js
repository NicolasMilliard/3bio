import { expect, test } from 'bun:test';

import { THREEBIO_ATTRIBUTE_KEY } from '../src/constants/attributes.ts';
import { cleanupManagedGroveResources } from '../src/features/privacy/services/cleanupManagedGroveResources.ts';
import {
  markGrovePublicationConfirmed,
  markManagedGroveResourcesOrphaned,
  readGroveManagedResourceManifest,
  recordManagedGroveResources,
} from '../src/features/editor/services/groveManagedResourceManifest.ts';

const ACCOUNT_ADDRESS = '0x1111111111111111111111111111111111111111';

const createStorage = () => {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

const record = (storage, resources, now) =>
  recordManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    resources,
    storage,
    now: () => now,
    createRecordId: (() => {
      let sequence = 0;
      return () => `record-${now}-${++sequence}`;
    })(),
  });

test('cleanup deletes only inactive managed resources absent from live Lens metadata', async () => {
  const storage = createStorage();

  record(
    storage,
    [
      { storageKey: 'old-image', kind: 'image' },
      { storageKey: 'old-metadata', kind: 'metadata' },
    ],
    1,
  );
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'old-metadata',
    referenceKeys: ['old-image'],
    storage,
    now: () => 2,
    createRecordId: () => 'published-old',
  });
  record(
    storage,
    [
      { storageKey: 'current-image', kind: 'image' },
      { storageKey: 'current-metadata', kind: 'metadata' },
      { storageKey: 'ambiguous-upload', kind: 'image' },
    ],
    3,
  );
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'current-metadata',
    referenceKeys: ['current-image'],
    storage,
    now: () => 4,
    createRecordId: () => 'published-current',
  });

  const deletedKeys = [];
  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {
      picture: 'https://api.grove.storage/current-image',
      attributes: [
        {
          value: JSON.stringify({
            ignored: 'https://untrusted.example/old-image',
          }),
        },
      ],
    },
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async ({ resources }) => {
        const candidates = [...resources];
        deletedKeys.push(...candidates.map(({ storageKey }) => storageKey));

        return {
          results: candidates.map((resource) => ({
            status: 'deleted',
            resource,
          })),
          deleted: candidates,
          retained: [],
        };
      },
    },
  });

  expect(result.ok).toBe(true);
  expect(deletedKeys).toEqual(['old-image']);
  expect(result.deleted.map(({ storageKey }) => storageKey)).toEqual([
    'old-image',
  ]);

  const remaining = readGroveManagedResourceManifest({
    accountAddress: ACCOUNT_ADDRESS,
    storage,
  });
  expect(remaining.ok).toBe(true);
  expect(
    remaining.manifest.resources.map(({ storageKey }) => storageKey),
  ).toEqual([
    'ambiguous-upload',
    'current-image',
    'current-metadata',
    'old-metadata',
  ]);
  expect(
    remaining.manifest.resources.find(
      ({ storageKey }) => storageKey === 'ambiguous-upload',
    )?.state,
  ).toBe('pending');
});

test('cleanup retains failed deletions in the manifest', async () => {
  const storage = createStorage();
  record(
    storage,
    [
      { storageKey: 'old-image', kind: 'image' },
      { storageKey: 'old-metadata', kind: 'metadata' },
    ],
    1,
  );
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'old-metadata',
    referenceKeys: ['old-image'],
    storage,
    now: () => 2,
    createRecordId: () => 'published-old',
  });
  record(storage, [{ storageKey: 'current-metadata', kind: 'metadata' }], 3);
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'current-metadata',
    referenceKeys: [],
    storage,
    now: () => 4,
    createRecordId: () => 'published-current',
  });

  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {},
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async ({ resources }) => {
        const retained = [...resources];
        return {
          results: retained.map((resource) => ({
            status: 'failed',
            resource,
            error: new Error('wallet rejected'),
          })),
          deleted: [],
          retained,
        };
      },
    },
  });

  expect(result.ok).toBe(true);
  expect(result.deleted).toEqual([]);
  expect(result.retained.map(({ storageKey }) => storageKey)).toEqual([
    'old-image',
  ]);

  const remaining = readGroveManagedResourceManifest({
    accountAddress: ACCOUNT_ADDRESS,
    storage,
  });
  expect(
    remaining.manifest.resources.map(({ storageKey }) => storageKey),
  ).toEqual(['current-metadata', 'old-image', 'old-metadata']);
});

test('cleanup reports completed deletions when the local manifest cannot be updated', async () => {
  const storage = createStorage();
  record(
    storage,
    [
      { storageKey: 'old-image', kind: 'image' },
      { storageKey: 'old-metadata', kind: 'metadata' },
    ],
    1,
  );
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'old-metadata',
    referenceKeys: ['old-image'],
    storage,
    now: () => 2,
    createRecordId: () => 'published-old',
  });
  record(storage, [{ storageKey: 'current-metadata', kind: 'metadata' }], 3);
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'current-metadata',
    referenceKeys: [],
    storage,
    now: () => 4,
    createRecordId: () => 'published-current',
  });

  storage.setItem = () => {
    throw new Error('storage quota exceeded');
  };

  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {},
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async ({ resources }) => {
        const deleted = [...resources];
        return {
          results: deleted.map((resource) => ({
            status: 'deleted',
            resource,
          })),
          deleted,
          retained: [],
        };
      },
    },
  });

  expect(result).toMatchObject({
    ok: false,
    reason: 'manifest-sync-failed',
    manifestFailure: 'storage-write-failed',
    manifestMayBeStale: true,
    deleted: [{ storageKey: 'old-image' }],
    retained: [],
  });

  const staleManifest = readGroveManagedResourceManifest({
    accountAddress: ACCOUNT_ADDRESS,
    storage,
  });
  expect(staleManifest.ok).toBe(true);
  expect(
    staleManifest.manifest.resources.some(
      ({ storageKey }) => storageKey === 'old-image',
    ),
  ).toBe(true);
});

test('cleanup reports a stale manifest when a candidate changes during deletion', async () => {
  const storage = createStorage();
  const initial = record(
    storage,
    [
      { storageKey: 'old-image', kind: 'image' },
      { storageKey: 'old-metadata', kind: 'metadata' },
    ],
    1,
  );
  expect(initial.ok).toBe(true);
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'old-metadata',
    referenceKeys: ['old-image'],
    storage,
    now: () => 2,
    createRecordId: () => 'published-old',
  });
  record(storage, [{ storageKey: 'current-metadata', kind: 'metadata' }], 3);
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'current-metadata',
    referenceKeys: [],
    storage,
    now: () => 4,
    createRecordId: () => 'published-current',
  });

  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {},
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async ({ resources }) => {
        const deleted = [...resources];
        record(storage, [{ storageKey: 'old-image', kind: 'image' }], 5);
        return {
          results: deleted.map((resource) => ({
            status: 'deleted',
            resource,
          })),
          deleted,
          retained: [],
        };
      },
    },
  });

  expect(result).toMatchObject({
    ok: false,
    reason: 'manifest-sync-failed',
    manifestMayBeStale: true,
    deleted: [{ storageKey: 'old-image' }],
  });
});

test('cleanup protects managed references inside the live 3bio JSON attribute', async () => {
  const storage = createStorage();
  record(
    storage,
    [
      { storageKey: 'obsolete-image', kind: 'image' },
      { storageKey: 'referenced-image', kind: 'image' },
      { storageKey: 'old-metadata', kind: 'metadata' },
    ],
    1,
  );
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'old-metadata',
    referenceKeys: ['obsolete-image', 'referenced-image'],
    storage,
    now: () => 2,
    createRecordId: () => 'published-old',
  });
  record(storage, [{ storageKey: 'current-metadata', kind: 'metadata' }], 3);
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'current-metadata',
    referenceKeys: [],
    storage,
    now: () => 4,
    createRecordId: () => 'published-current',
  });

  const deletedKeys = [];
  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {
      attributes: [
        {
          key: THREEBIO_ATTRIBUTE_KEY,
          value: JSON.stringify({
            schemaVersion: 1,
            updatedAt: '2026-08-17T12:00:00.000Z',
            profile: {
              avatar: 'https://api.grove.storage/referenced-image',
            },
          }),
        },
      ],
    },
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async ({ resources }) => {
        const deleted = [...resources];
        deletedKeys.push(...deleted.map(({ storageKey }) => storageKey));
        return {
          results: deleted.map((resource) => ({
            status: 'deleted',
            resource,
          })),
          deleted,
          retained: [],
        };
      },
    },
  });

  expect(result.ok).toBe(true);
  expect(deletedKeys).toEqual(['obsolete-image']);
});

test('cleanup protects query-versioned references inside other Lens JSON attributes', async () => {
  const storage = createStorage();
  record(
    storage,
    [
      { storageKey: 'obsolete-image', kind: 'image' },
      { storageKey: 'reused-image', kind: 'image' },
      { storageKey: 'old-metadata', kind: 'metadata' },
    ],
    1,
  );
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'old-metadata',
    referenceKeys: ['obsolete-image', 'reused-image'],
    storage,
    now: () => 2,
    createRecordId: () => 'published-old',
  });
  record(storage, [{ storageKey: 'current-metadata', kind: 'metadata' }], 3);
  markGrovePublicationConfirmed({
    accountAddress: ACCOUNT_ADDRESS,
    metadataKey: 'current-metadata',
    referenceKeys: [],
    storage,
    now: () => 4,
    createRecordId: () => 'published-current',
  });

  const deletedKeys = [];
  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {
      attributes: [
        {
          key: 'another-app',
          type: 'JSON',
          value: JSON.stringify({
            banner: 'https://api.grove.storage/reused-image?v=2#social-preview',
          }),
        },
      ],
    },
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async ({ resources }) => {
        const deleted = [...resources];
        deletedKeys.push(...deleted.map(({ storageKey }) => storageKey));
        return {
          results: deleted.map((resource) => ({
            status: 'deleted',
            resource,
          })),
          deleted,
          retained: [],
        };
      },
    },
  });

  expect(result.ok).toBe(true);
  expect(deletedKeys).toEqual(['obsolete-image']);
});

test('cleanup revalidates live Lens references immediately before deletion', async () => {
  const storage = createStorage();
  const recorded = record(
    storage,
    [{ storageKey: 'candidate-image', kind: 'image' }],
    1,
  );
  expect(recorded.ok).toBe(true);
  markManagedGroveResourcesOrphaned({
    accountAddress: ACCOUNT_ADDRESS,
    resources: recorded.recorded,
    storage,
    now: () => 2,
    createRecordId: () => 'orphaned-candidate',
  });
  let verificationCalls = 0;

  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {},
    signer: { signMessage: async () => '0xsigned' },
    storage,
    revalidateLatestAccountMetadata: async () => {
      verificationCalls += 1;
      return {
        ok: true,
        metadata: {
          picture:
            'https://api.grove.storage/candidate-image?v=published-elsewhere',
        },
      };
    },
    dependencies: {
      deleteResources: async () => {
        throw new Error('cleanup must not run');
      },
    },
  });

  expect(verificationCalls).toBe(1);
  expect(result).toMatchObject({
    ok: true,
    deleted: [],
    retained: [{ storageKey: 'candidate-image' }],
  });
});

test('cleanup fails closed when a JSON attribute exceeds inspection depth', async () => {
  const storage = createStorage();
  const recorded = record(
    storage,
    [{ storageKey: 'candidate-image', kind: 'image' }],
    1,
  );
  expect(recorded.ok).toBe(true);
  markManagedGroveResourcesOrphaned({
    accountAddress: ACCOUNT_ADDRESS,
    resources: recorded.recorded,
    storage,
    now: () => 2,
    createRecordId: () => 'orphaned-candidate',
  });
  let nested = {
    image: 'https://api.grove.storage/candidate-image',
  };

  for (let depth = 0; depth < 40; depth += 1) {
    nested = { nested };
  }

  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {
      attributes: [
        {
          key: 'deep-json',
          type: 'JSON',
          value: JSON.stringify(nested),
        },
      ],
    },
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async () => {
        throw new Error('cleanup must not run');
      },
    },
  });

  expect(result).toEqual({
    ok: false,
    reason: 'metadata-inspection-failed',
  });
});

test('cleanup fails closed for a future 3bio schema', async () => {
  const storage = createStorage();
  const recorded = record(
    storage,
    [{ storageKey: 'candidate-image', kind: 'image' }],
    1,
  );

  expect(recorded.ok).toBe(true);

  const orphaned = markManagedGroveResourcesOrphaned({
    accountAddress: ACCOUNT_ADDRESS,
    resources: recorded.recorded,
    storage,
    now: () => 2,
    createRecordId: () => 'orphaned-candidate',
  });

  expect(orphaned.ok).toBe(true);

  const result = await cleanupManagedGroveResources({
    accountAddress: ACCOUNT_ADDRESS,
    latestAccountMetadata: {
      attributes: [
        {
          key: THREEBIO_ATTRIBUTE_KEY,
          value: JSON.stringify({
            schemaVersion: 999,
            updatedAt: '2026-08-17T12:00:00.000Z',
            profile: {
              avatar: 'https://api.grove.storage/candidate-image',
            },
          }),
        },
      ],
    },
    signer: { signMessage: async () => '0xsigned' },
    storage,
    dependencies: {
      deleteResources: async () => {
        throw new Error('cleanup must not run');
      },
    },
  });

  expect(result).toEqual({
    ok: false,
    reason: 'unsupported-schema-version',
  });
});
