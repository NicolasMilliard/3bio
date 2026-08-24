import { expect, test } from 'bun:test';

import {
  collectGroveResourceReferences,
  diffGroveResourceReferences,
  getGroveStorageKeyFromReference,
  inspectGroveResourceReferences,
  normalizeGroveStorageKey,
  selectManagedGroveCleanupCandidates,
} from '../src/features/editor/helpers/groveResources.ts';
import { GROVE_MEDIA_ORIGIN } from '../src/lib/trustedMedia.ts';

test('normalizes opaque Grove keys and canonical lens URIs', () => {
  expect(normalizeGroveStorageKey('abc-123_DEF.xyz')).toBe('abc-123_DEF.xyz');
  expect(normalizeGroveStorageKey('lens://abc-123_DEF.xyz')).toBe(
    'abc-123_DEF.xyz',
  );

  for (const value of [
    '',
    ' lens://abc',
    'lens://abc ',
    'lens://',
    'lens://../abc',
    'lens://abc/child',
    'lens://abc?download=1',
    'https://api.grove.storage/abc',
  ]) {
    expect(normalizeGroveStorageKey(value)).toBeNull();
  }
});

test('extracts references only from Lens URIs and the exact Grove origin', () => {
  expect(getGroveStorageKeyFromReference('lens://avatar-key')).toBe(
    'avatar-key',
  );
  expect(
    getGroveStorageKeyFromReference(`${GROVE_MEDIA_ORIGIN}/avatar-key`),
  ).toBe('avatar-key');
  expect(
    getGroveStorageKeyFromReference(
      `${GROVE_MEDIA_ORIGIN}/avatar-key?v=1#preview`,
    ),
  ).toBe('avatar-key');
  expect(
    getGroveStorageKeyFromReference(`${GROVE_MEDIA_ORIGIN}/%61vatar-key`),
  ).toBe('avatar-key');
  expect(
    getGroveStorageKeyFromReference(
      'https://user:secret@api.grove.storage/avatar-key',
    ),
  ).toBe('avatar-key');

  for (const value of [
    'avatar-key',
    'https://api.grove.storage.evil.example/avatar-key',
    'https://api.grove.storage/avatar-key/child',
    'https://images.example/avatar-key',
  ]) {
    expect(getGroveStorageKeyFromReference(value)).toBeNull();
  }
});

test('collects and deduplicates Grove references from JSON-like data', () => {
  const cyclic = {
    avatar: 'https://api.grove.storage/avatar-key',
    nested: [
      'lens://cover-key',
      'lens://avatar-key',
      'https://images.example/external.png',
    ],
  };
  cyclic.self = cyclic;

  expect(collectGroveResourceReferences(cyclic)).toEqual([
    'avatar-key',
    'cover-key',
  ]);
  expect(collectGroveResourceReferences(new URL('lens://ignored'))).toEqual([]);
});

test('strict reference inspection reports depth truncation', () => {
  let nested = { image: 'https://api.grove.storage/deep-image' };

  for (let depth = 0; depth < 40; depth += 1) {
    nested = { nested };
  }

  expect(inspectGroveResourceReferences(nested)).toEqual({
    inspectionComplete: false,
    referenceKeys: [],
  });
});

test('diffs canonical references without duplicate keys', () => {
  expect(
    diffGroveResourceReferences(
      ['lens://removed', 'retained', 'retained', 'invalid/key'],
      ['retained', 'lens://added', 'invalid/key'],
    ),
  ).toEqual({
    added: ['added'],
    removed: ['removed'],
    retained: ['retained'],
  });
});

test('intersects removed references with explicitly managed resources', () => {
  const managed = [
    { storageKey: 'removed', marker: 1 },
    { storageKey: 'retained', marker: 2 },
    { storageKey: 'never-referenced', marker: 3 },
    { storageKey: 'removed', marker: 4 },
  ];

  expect(
    selectManagedGroveCleanupCandidates({
      resources: managed,
      previousReferences: ['removed', 'retained', 'external'],
      nextReferences: ['retained'],
    }),
  ).toEqual([{ storageKey: 'removed', marker: 1 }]);
});
