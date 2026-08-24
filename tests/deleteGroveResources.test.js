import { expect, test } from 'bun:test';

import { deleteGroveResourcesBestEffort } from '../src/features/editor/services/deleteGroveResources.ts';

const resource = (storageKey, recordId = storageKey) => ({
  storageKey,
  recordId,
  kind: 'image',
  state: 'orphaned',
  recordedAt: 1,
});

const signer = {
  signMessage: async () => '0xsigned',
};

test('deletes sequentially, deduplicates keys, and continues after failures', async () => {
  const calls = [];
  let activeCalls = 0;

  const summary = await deleteGroveResourcesBestEffort({
    resources: [
      resource('deleted'),
      resource('not-deleted'),
      resource('failed'),
      resource('deleted', 'duplicate-record'),
      resource('invalid/key'),
    ],
    signer,
    dependencies: {
      deleteResource: async (storageKey, receivedSigner) => {
        expect(receivedSigner).toBe(signer);
        expect(activeCalls).toBe(0);
        activeCalls += 1;
        calls.push(storageKey);

        try {
          if (storageKey === 'failed') throw new Error('network failure');
          return { success: storageKey === 'deleted' };
        } finally {
          activeCalls -= 1;
        }
      },
    },
  });

  expect(calls).toEqual(['deleted', 'not-deleted', 'failed']);
  expect(summary.results.map((result) => result.status)).toEqual([
    'deleted',
    'not-deleted',
    'failed',
  ]);
  expect(summary.deleted.map((item) => item.storageKey)).toEqual([
    'deleted',
  ]);
  expect(summary.retained.map((item) => item.storageKey)).toEqual([
    'not-deleted',
    'failed',
  ]);
});
