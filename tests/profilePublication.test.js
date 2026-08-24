import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

import { THREEBIO_ATTRIBUTE_KEY } from '../src/constants/attributes.ts';
import { THREE_BIO_METADATA_SCHEMA_VERSION } from '../src/constants/metadata.ts';
import { buildPersistedThreeBioMetadata } from '../src/features/editor/helpers/buildPersistedThreeBioMetadata.ts';
import {
  createProfileModerationMatcher,
  getProfilePublicationDecision,
  getProfilePublicationStatus,
  normalizeLensAccountAddressForModeration,
  normalizeLensHandleForModeration,
  readProfilePublicationState,
} from '../src/features/profile/publication.ts';
import { parseThreeBioMetadataAttributes } from '../src/helpers/parseThreeBioMetadata.ts';
import { buildThreeBioPublicationUpdate } from '../src/helpers/buildThreeBioPublicationUpdate.ts';

const editorValues = {
  name: 'Alice',
  bio: 'Creator',
  socialLinks: [],
  links: [],
  theme: 'classic',
  displayStatistics: true,
  displayBranding: true,
};

const versioned = (seconds, state) => ({
  schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
  updatedAt: `2026-08-17T10:00:${String(seconds).padStart(2, '0')}.000Z`,
  ...state,
});

const attribute = (value) => ({
  key: THREEBIO_ATTRIBUTE_KEY,
  value: JSON.stringify(value),
});

describe('profile publication metadata', () => {
  test('defaults profiles without an explicit publication state to public', () => {
    expect(getProfilePublicationStatus(undefined)).toBe('public');
    expect(getProfilePublicationDecision({ lensHandle: 'alice' })).toEqual({
      isPublic: true,
      status: 'public',
    });
  });

  test('merges a valid latest publication state and ignores malformed values', () => {
    const attributes = [
      attribute(
        versioned(1, {
          profile: { name: 'Alice' },
          publication: { status: 'opted-out' },
        }),
      ),
      attribute(versioned(2, { publication: { status: 'private-ish' } })),
    ];

    expect(getProfilePublicationStatus(attributes)).toBe('opted-out');
    expect(parseThreeBioMetadataAttributes(attributes)).toMatchObject({
      profile: { name: 'Alice' },
      publication: { status: 'opted-out' },
    });
  });

  test('a newer public state restores an opted-out profile', () => {
    const attributes = [
      attribute(versioned(1, { publication: { status: 'opted-out' } })),
      attribute(versioned(2, { publication: { status: 'public' } })),
    ];

    expect(getProfilePublicationStatus(attributes)).toBe('public');
  });

  test('reports an unsupported future schema so rendering can fail closed', () => {
    const state = readProfilePublicationState([
      attribute(
        versioned(1, {
          profile: { name: 'Previously public' },
        }),
      ),
      attribute({
        schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION + 1,
        updatedAt: '2026-08-17T10:00:02.000Z',
        publication: { status: 'future-private-state' },
      }),
    ]);

    expect(state).toEqual({
      hasUnsupportedSchemaVersion: true,
      status: 'public',
    });
    expect(
      getProfilePublicationDecision({
        hasUnsupportedSchemaVersion: state.hasUnsupportedSchemaVersion,
        publicationStatus: state.status,
      }),
    ).toEqual({
      isPublic: false,
      reason: 'unsupported-schema',
      status: 'public',
    });
  });

  test('distinguishes opt-out and deletion while hiding both', () => {
    expect(
      getProfilePublicationDecision({ publicationStatus: 'opted-out' }),
    ).toEqual({
      isPublic: false,
      reason: 'opted-out',
      status: 'opted-out',
    });
    expect(
      getProfilePublicationDecision({ publicationStatus: 'deleted' }),
    ).toEqual({
      isPublic: false,
      reason: 'deleted',
      status: 'deleted',
    });
  });

  test('publication updates preserve state on opt-out and restore', () => {
    const optedOut = buildThreeBioPublicationUpdate({
      current: { profile: { name: 'Alice' } },
      status: 'opted-out',
      updatedAt: '2026-08-17T10:00:01.000Z',
    });
    const restored = buildThreeBioPublicationUpdate({
      current: optedOut,
      status: 'public',
      updatedAt: '2026-08-17T10:00:02.000Z',
    });

    expect(optedOut.publication).toEqual({ status: 'opted-out' });
    expect(optedOut.profile).toEqual({ name: 'Alice' });
    expect(restored.publication).toEqual({ status: 'public' });
    expect(restored.profile).toEqual({ name: 'Alice' });
  });

  test('a deletion update contains only the deletion marker', () => {
    const deleted = buildThreeBioPublicationUpdate({
      current: {
        profile: { name: 'Alice', avatar: 'lens://old-avatar' },
        theme: {
          name: 'classic',
          displayStatistics: true,
          displayBranding: true,
        },
        settings: { subscription: { type: 'free' } },
        tombstones: ['profile.bio'],
      },
      status: 'deleted',
      updatedAt: '2026-08-17T10:00:02.000Z',
    });

    expect(deleted).toEqual({
      schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
      updatedAt: '2026-08-17T10:00:02.000Z',
      publication: { status: 'deleted' },
    });
  });

  test('ordinary editor saves preserve the existing publication state', () => {
    const metadata = buildPersistedThreeBioMetadata({
      current: {
        profile: { name: 'Before' },
        publication: { status: 'opted-out' },
      },
      values: { ...editorValues, name: 'After' },
      avatarUri: undefined,
      coverPictureUri: undefined,
      linksPanelBackgroundUri: undefined,
      updatedAt: '2026-08-17T10:00:01.000Z',
    });

    expect(metadata.publication).toEqual({ status: 'opted-out' });
  });
});

describe('static profile moderation', () => {
  test('normalizes handles and account addresses consistently', () => {
    expect(normalizeLensHandleForModeration('  @Alice.Lens ')).toBe(
      'alice.lens',
    );
    expect(normalizeLensAccountAddressForModeration(' 0xABcdEF ')).toBe(
      '0xabcdef',
    );
  });

  test('matches normalized handle and address denylist entries', () => {
    const isModerated = createProfileModerationMatcher({
      handles: ['Alice.Lens'],
      accountAddresses: ['0xABCDEF'],
    });

    expect(isModerated({ lensHandle: '@ALICE.LENS' })).toBe(true);
    expect(isModerated({ accountAddress: '0xabcdef' })).toBe(true);
    expect(isModerated({ lensHandle: 'bob', accountAddress: '0x123' })).toBe(
      false,
    );
    expect(isModerated({ lensHandle: 'alice' })).toBe(false);
  });
});

test('client rendering does not apply hidden profile data or request its stats', () => {
  const source = readFileSync(
    new URL('../src/features/profile/UserProfile.tsx', import.meta.url),
    'utf8',
  );

  expect(source).toContain(
    "account: isPublic && account ? account.address : ''",
  );
  expect(source).toMatch(
    /const threeBioMetadata =\s+isPublic && account \? formatToThreeBioMetadata/,
  );
  expect(source).toContain('const isUnavailable = !isPublic');
});
