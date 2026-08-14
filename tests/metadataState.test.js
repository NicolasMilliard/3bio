import { describe, expect, test } from 'bun:test';
import { MetadataAttributeType as ApiMetadataAttributeType } from '@lens-protocol/react';

import { THREEBIO_ATTRIBUTE_KEY } from '../src/constants/attributes.ts';
import {
  LENS_METADATA_MAX_ATTRIBUTES,
  THREE_BIO_BIO_MAX_LENGTH,
  THREE_BIO_LINK_KEY_MAX_LENGTH,
  THREE_BIO_LINKS_MAX_ITEMS,
  THREE_BIO_METADATA_MAX_BYTES,
  THREE_BIO_METADATA_MAX_CANDIDATES,
  THREE_BIO_METADATA_MAX_DEPTH,
  THREE_BIO_METADATA_SCHEMA_VERSION,
  THREE_BIO_METADATA_TOTAL_CANDIDATE_BYTES,
  THREE_BIO_NAME_MAX_LENGTH,
  THREE_BIO_SETTINGS_ID_MAX_LENGTH,
  THREE_BIO_SOCIAL_LINKS_MAX_ITEMS,
  THREE_BIO_URL_MAX_LENGTH,
} from '../src/constants/metadata.ts';
import { THREE_BIO_DEFAULT_THEME } from '../src/constants/themes.ts';
import { buildPersistedThreeBioMetadata } from '../src/features/editor/helpers/buildPersistedThreeBioMetadata.ts';
import { extractProfileFromLensAccount } from '../src/features/profile/edge/lensAccount.ts';
import { formatMetadataBeforeUpload } from '../src/helpers/formatMetadataBeforeUpload.ts';
import { formatToThreeBioMetadata } from '../src/helpers/formatToThreeBioMetadata.ts';
import {
  parseThreeBioMetadata,
  parseThreeBioMetadataAttributes,
  readThreeBioMetadataAttributes,
} from '../src/helpers/parseThreeBioMetadata.ts';
import { threeBioMetadataSchema } from '../src/schemas/threeBioMetadata.schema.ts';

const timestamp = (seconds) =>
  `2026-08-12T10:00:${String(seconds).padStart(2, '0')}.000Z`;

const versioned = (updatedAt, state = {}) => ({
  schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
  updatedAt,
  ...state,
});

const attribute = (value, key = THREEBIO_ATTRIBUTE_KEY) => ({ key, value });

const link = (key, value = 'https://example.com') => ({
  type: 'String',
  key,
  value,
});

const jsonWithExactBytes = (targetBytes, state = {}) => {
  const empty = JSON.stringify({ ...state, padding: '' });
  const remaining = targetBytes - new TextEncoder().encode(empty).byteLength;

  if (remaining < 0) {
    throw new Error(`State is already larger than ${targetBytes} bytes`);
  }

  const result = JSON.stringify({ ...state, padding: 'a'.repeat(remaining) });

  if (new TextEncoder().encode(result).byteLength !== targetBytes) {
    throw new Error('Failed to construct an exact-size JSON candidate');
  }

  return result;
};

const nestedValue = (depth) => {
  let value = 'leaf';

  for (let index = 0; index < depth; index += 1) {
    value = { child: value };
  }

  return value;
};

const defaultEditorValues = {
  name: 'Alice',
  bio: 'Creator',
  socialLinks: [],
  links: [],
  theme: THREE_BIO_DEFAULT_THEME,
  displayStatistics: true,
  displayBranding: true,
};

describe('metadata candidate parsing', () => {
  test('reads legacy unversioned metadata', () => {
    expect(
      parseThreeBioMetadata({
        profile: {
          name: 'Legacy Alice',
          bio: null,
          avatar: 'https://images.example/legacy.png',
        },
        theme: { name: 'midnight', displayStatistics: false },
        settings: { subscription: { id: 'legacy-plan' } },
      }),
    ).toEqual({
      profile: {
        name: 'Legacy Alice',
        bio: null,
        avatar: 'https://images.example/legacy.png',
      },
      theme: {
        name: 'midnight',
        displayStatistics: false,
        displayBranding: true,
      },
      settings: {
        subscription: { id: 'legacy-plan', type: 'free' },
      },
    });
  });

  test('reads canonical schema-version 1 metadata with its timestamp', () => {
    const value = versioned(timestamp(1), {
      profile: { name: 'Canonical Alice' },
      theme: { displayBranding: false },
    });

    expect(parseThreeBioMetadata(value)).toEqual({
      schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
      updatedAt: timestamp(1),
      profile: { name: 'Canonical Alice' },
      theme: {
        name: THREE_BIO_DEFAULT_THEME,
        displayStatistics: true,
        displayBranding: false,
      },
    });
  });

  test('treats string and object candidates equivalently', () => {
    const value = versioned(timestamp(2), {
      profile: {
        name: 'Alice',
        links: [link('links.example.0')],
      },
      theme: { name: 'seaside' },
    });

    expect(parseThreeBioMetadata(JSON.stringify(value))).toEqual(
      parseThreeBioMetadata(value),
    );
  });

  test('skips a future schema version while reporting it to the caller', () => {
    const supported = versioned(timestamp(1), {
      profile: { name: 'Supported' },
    });
    const future = {
      schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION + 1,
      updatedAt: timestamp(2),
      profile: { name: 'Future' },
    };

    expect(parseThreeBioMetadata(future)).toBeUndefined();
    expect(
      readThreeBioMetadataAttributes([
        attribute(supported),
        attribute(JSON.stringify(future)),
      ]),
    ).toEqual({
      metadata: {
        schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
        updatedAt: timestamp(1),
        profile: { name: 'Supported' },
      },
      hasUnsupportedSchemaVersion: true,
    });
  });

  test('keeps an unrelated legacy version field backward compatible', () => {
    const value = {
      version: 'old-client-release',
      profile: { name: 'Legacy Alice' },
    };

    expect(parseThreeBioMetadata(value)?.profile?.name).toBe('Legacy Alice');
    expect(readThreeBioMetadataAttributes([attribute(value)])).toEqual({
      metadata: { profile: { name: 'Legacy Alice' } },
      hasUnsupportedSchemaVersion: false,
    });
  });

  test('requires schemaVersion and updatedAt together in the strict schema', () => {
    expect(
      threeBioMetadataSchema.safeParse({
        schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
      }).success,
    ).toBe(false);
    expect(
      threeBioMetadataSchema.safeParse({ updatedAt: timestamp(1) }).success,
    ).toBe(false);
    expect(
      threeBioMetadataSchema.safeParse({ profile: { name: 'Legacy' } })
        .success,
    ).toBe(true);
    expect(
      threeBioMetadataSchema.safeParse(
        versioned('2026-08-12T10:00Z', { profile: { name: 'Alice' } }),
      ).success,
    ).toBe(false);
  });

  test('salvages valid fields and list entries from a partially invalid candidate', () => {
    const parsed = parseThreeBioMetadata(
      versioned(timestamp(3), {
        profile: {
          name: 'Alice',
          bio: 42,
          avatar: 'javascript:alert(1)',
          coverPicture: '  https://images.example/cover.png  ',
          socialLinks: [
            {
              key: 'socialLinks.github',
              value: 'https://github.com/alice',
            },
            link('   ', 'https://example.com/empty-key'),
            link('socialLinks.bad-scheme', 'ftp://example.com'),
            {
              type: 'Unsupported',
              key: 'socialLinks.unknown',
              value: 'https://example.com/unknown',
            },
          ],
        },
        theme: { name: 'unknown', displayStatistics: false },
        settings: {
          subscription: { id: 'plan-1', type: 'enterprise' },
        },
      }),
    );

    expect(parsed).toEqual({
      schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
      updatedAt: timestamp(3),
      profile: {
        name: 'Alice',
        coverPicture: 'https://images.example/cover.png',
        socialLinks: [
          {
            type: 'String',
            key: 'socialLinks.github',
            value: 'https://github.com/alice',
          },
        ],
      },
      theme: {
        name: THREE_BIO_DEFAULT_THEME,
        displayStatistics: false,
        displayBranding: true,
      },
      settings: {
        subscription: { id: 'plan-1', type: 'free' },
      },
    });
  });

  test('does not let an invalid nonempty list clear an older list', () => {
    const oldLinks = [link('links.old.0', 'https://old.example/one')];
    const parsed = parseThreeBioMetadataAttributes([
      attribute(
        versioned(timestamp(1), { profile: { links: oldLinks } }),
      ),
      attribute(
        versioned(timestamp(2), {
          profile: {
            bio: 'The rest of the newest candidate is still valid',
            links: [
              link('', 'https://example.com'),
              link('links.bad.0', 'file:///tmp/not-http'),
            ],
          },
        }),
      ),
    ]);

    expect(parsed?.profile?.links).toEqual(oldLinks);
    expect(parsed?.profile?.bio).toBe(
      'The rest of the newest candidate is still valid',
    );
  });

  test('treats an empty list as an explicit atomic clear', () => {
    const parsed = parseThreeBioMetadataAttributes([
      attribute(
        versioned(timestamp(1), {
          profile: { links: [link('links.old.0')] },
        }),
      ),
      attribute(versioned(timestamp(2), { profile: { links: [] } })),
    ]);

    expect(parsed?.profile?.links).toEqual([]);
  });
});

describe('metadata reader safety limits', () => {
  test('accepts a raw candidate at the byte limit and rejects one byte more', () => {
    expect(
      parseThreeBioMetadata(
        jsonWithExactBytes(THREE_BIO_METADATA_MAX_BYTES),
      ),
    ).toEqual({});
    expect(
      parseThreeBioMetadata(
        jsonWithExactBytes(THREE_BIO_METADATA_MAX_BYTES + 1),
      ),
    ).toBeUndefined();
  });

  test('accepts the configured nesting depth and rejects the next level', () => {
    expect(
      parseThreeBioMetadata(nestedValue(THREE_BIO_METADATA_MAX_DEPTH)),
    ).toEqual({});
    expect(
      parseThreeBioMetadata(nestedValue(THREE_BIO_METADATA_MAX_DEPTH + 1)),
    ).toBeUndefined();
  });

  test('only considers the latest candidate window', () => {
    const attributes = [
      attribute(
        versioned('2099-01-01T00:00:00.000Z', {
          profile: { name: 'Outside window', bio: 'must not merge' },
        }),
      ),
      ...Array.from(
        { length: THREE_BIO_METADATA_MAX_CANDIDATES },
        (_, index) =>
          attribute(
            versioned(timestamp(index + 1), {
              profile: { name: `Inside window ${index + 1}` },
            }),
          ),
      ),
    ];

    const parsed = parseThreeBioMetadataAttributes(attributes);

    expect(parsed?.profile?.name).toBe(
      `Inside window ${THREE_BIO_METADATA_MAX_CANDIDATES}`,
    );
    expect(parsed?.profile?.bio).toBeUndefined();
  });

  test('caps the total bytes decoded across candidates', () => {
    expect(THREE_BIO_METADATA_TOTAL_CANDIDATE_BYTES).toBe(
      THREE_BIO_METADATA_MAX_BYTES * 4,
    );

    const ignoredOlderState = attribute({ profile: { name: 'Too old' } });
    const budgetFillingCandidates = Array.from({ length: 4 }, () =>
      attribute(jsonWithExactBytes(THREE_BIO_METADATA_MAX_BYTES)),
    );

    expect(
      parseThreeBioMetadataAttributes([
        ignoredOlderState,
        ...budgetFillingCandidates,
      ]),
    ).toEqual({});
  });

  test('enforces scalar string and URL boundaries while salvaging siblings', () => {
    const exactUrl =
      'https://e.co/' + 'a'.repeat(THREE_BIO_URL_MAX_LENGTH - 13);
    const overlongUrl = `${exactUrl}a`;
    const parsed = parseThreeBioMetadata({
      profile: {
        name: 'n'.repeat(THREE_BIO_NAME_MAX_LENGTH),
        bio: 'b'.repeat(THREE_BIO_BIO_MAX_LENGTH),
        avatar: exactUrl,
        coverPicture: overlongUrl,
      },
      settings: {
        subscription: {
          id: 'i'.repeat(THREE_BIO_SETTINGS_ID_MAX_LENGTH),
        },
      },
    });

    expect(exactUrl).toHaveLength(THREE_BIO_URL_MAX_LENGTH);
    expect(parsed?.profile?.name).toHaveLength(THREE_BIO_NAME_MAX_LENGTH);
    expect(parsed?.profile?.bio).toHaveLength(THREE_BIO_BIO_MAX_LENGTH);
    expect(parsed?.profile?.avatar).toBe(exactUrl);
    expect(parsed?.profile?.coverPicture).toBeUndefined();
    expect(parsed?.settings?.subscription.id).toHaveLength(
      THREE_BIO_SETTINGS_ID_MAX_LENGTH,
    );

    const overlong = parseThreeBioMetadata({
      profile: {
        name: 'n'.repeat(THREE_BIO_NAME_MAX_LENGTH + 1),
        bio: 'b'.repeat(THREE_BIO_BIO_MAX_LENGTH + 1),
      },
      settings: {
        subscription: {
          id: 'i'.repeat(THREE_BIO_SETTINGS_ID_MAX_LENGTH + 1),
        },
      },
      theme: { displayBranding: false },
    });

    expect(overlong?.profile).toBeUndefined();
    expect(overlong?.settings).toBeUndefined();
    expect(overlong?.theme?.displayBranding).toBe(false);
  });

  test('enforces link key and list boundaries', () => {
    const parsed = parseThreeBioMetadata({
      profile: {
        links: [
          link('k'.repeat(THREE_BIO_LINK_KEY_MAX_LENGTH)),
          link('k'.repeat(THREE_BIO_LINK_KEY_MAX_LENGTH + 1)),
        ],
        socialLinks: Array.from(
          { length: THREE_BIO_SOCIAL_LINKS_MAX_ITEMS + 1 },
          (_, index) => link(`socialLinks.platform-${index}`),
        ),
      },
    });

    expect(parsed?.profile?.links).toHaveLength(1);
    expect(parsed?.profile?.links?.[0].key).toHaveLength(
      THREE_BIO_LINK_KEY_MAX_LENGTH,
    );
    expect(parsed?.profile?.socialLinks).toHaveLength(
      THREE_BIO_SOCIAL_LINKS_MAX_ITEMS,
    );

    const regularLinks = Array.from(
      { length: THREE_BIO_LINKS_MAX_ITEMS + 1 },
      (_, index) => link(`links.example.${index}`),
    );

    expect(
      parseThreeBioMetadata({ profile: { links: regularLinks } })?.profile
        ?.links,
    ).toHaveLength(THREE_BIO_LINKS_MAX_ITEMS);

    const validAfterInvalid = parseThreeBioMetadata({
      profile: {
        links: [
          ...Array.from({ length: THREE_BIO_LINKS_MAX_ITEMS }, () => null),
          link('links.valid.0'),
        ],
      },
    });

    expect(validAfterInvalid?.profile?.links).toEqual([link('links.valid.0')]);
  });
});

describe('latest-state merging', () => {
  test('uses timestamps independently of attribute order', () => {
    const older = attribute(
      versioned(timestamp(1), {
        profile: { name: 'Older', bio: 'Preserved older leaf' },
      }),
    );
    const newer = attribute(
      versioned(timestamp(2), { profile: { name: 'Newer' } }),
    );

    for (const attributes of [
      [older, newer],
      [newer, older],
    ]) {
      const parsed = parseThreeBioMetadataAttributes(attributes);

      expect(parsed?.profile?.name).toBe('Newer');
      expect(parsed?.profile?.bio).toBe('Preserved older leaf');
      expect(parsed?.updatedAt).toBe(timestamp(2));
    }
  });

  test('uses attribute position as the equal-timestamp tie breaker', () => {
    const first = attribute(
      versioned(timestamp(1), { profile: { name: 'First' } }),
    );
    const second = attribute(
      versioned(timestamp(1), { profile: { name: 'Second' } }),
    );

    expect(parseThreeBioMetadataAttributes([first, second])?.profile?.name).toBe(
      'Second',
    );
    expect(parseThreeBioMetadataAttributes([second, first])?.profile?.name).toBe(
      'First',
    );
  });

  test('orders timestamps with sub-millisecond precision', () => {
    const newer = attribute(
      versioned('2026-08-12T10:00:00.0000000009Z', {
        profile: { name: 'Newer' },
      }),
    );
    const older = attribute(
      versioned('2026-08-12T10:00:00.0000000001Z', {
        profile: { name: 'Older' },
      }),
    );

    expect(parseThreeBioMetadataAttributes([newer, older])?.profile?.name).toBe(
      'Newer',
    );
  });

  test('merges disjoint leaves from multiple valid states', () => {
    const parsed = parseThreeBioMetadataAttributes([
      attribute(
        versioned(timestamp(1), {
          profile: { name: 'Alice' },
          theme: { name: 'seaside', displayBranding: false },
          settings: { subscription: { id: 'plan-1' } },
        }),
      ),
      attribute(
        versioned(timestamp(2), {
          profile: { bio: 'Creator' },
          theme: { displayStatistics: false },
          settings: { subscription: { type: 'premium' } },
        }),
      ),
    ]);

    expect(parsed).toEqual({
      schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
      updatedAt: timestamp(2),
      profile: { name: 'Alice', bio: 'Creator' },
      theme: {
        name: 'seaside',
        displayStatistics: false,
        displayBranding: false,
      },
      settings: {
        subscription: { id: 'plan-1', type: 'premium' },
      },
    });
  });

  test('does not reinterpret inherited legacy nulls as v1 tombstones', () => {
    const parsed = parseThreeBioMetadataAttributes([
      attribute({ profile: { name: null, bio: null } }),
      attribute(
        versioned(timestamp(2), { theme: { displayBranding: false } }),
      ),
    ]);

    expect(parsed?.profile?.name).toBeUndefined();
    expect(parsed?.profile?.bio).toBeUndefined();
    expect(parsed?.tombstones ?? []).not.toContain('profile.name');
    expect(parsed?.tombstones ?? []).not.toContain('profile.bio');
  });

  test('does not let a malformed newest attribute hide older valid state', () => {
    const older = versioned(timestamp(1), {
      profile: { name: 'Still visible' },
    });

    expect(
      parseThreeBioMetadataAttributes([
        attribute(JSON.stringify(older)),
        attribute('{ definitely not JSON'),
      ]),
    ).toEqual({
      schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
      updatedAt: timestamp(1),
      profile: { name: 'Still visible' },
    });
  });

  test('does not count malformed values against the candidate window', () => {
    const older = attribute(
      versioned(timestamp(1), { profile: { name: 'Still visible' } }),
    );
    const malformed = Array.from(
      { length: THREE_BIO_METADATA_MAX_CANDIDATES },
      () => attribute('{invalid'),
    );

    expect(
      parseThreeBioMetadataAttributes([older, ...malformed])?.profile?.name,
    ).toBe('Still visible');
  });

  test('does not count semantically invalid or neutral values against the candidate window', () => {
    const older = attribute(
      versioned(timestamp(1), { profile: { name: 'Still visible' } }),
    );
    const invalid = Array.from(
      { length: THREE_BIO_METADATA_MAX_CANDIDATES },
      () => attribute({ profile: { name: 123 } }),
    );
    const neutral = Array.from(
      { length: THREE_BIO_METADATA_MAX_CANDIDATES },
      () => attribute({ profile: { unknown: true } }),
    );

    expect(
      parseThreeBioMetadataAttributes([older, ...invalid, ...neutral])?.profile
        ?.name,
    ).toBe('Still visible');
  });

  test('keeps arrays atomic instead of merging their entries', () => {
    const newerLinks = [link('links.new.0', 'https://new.example')];
    const parsed = parseThreeBioMetadataAttributes([
      attribute(
        versioned(timestamp(1), {
          profile: {
            links: [
              link('links.old.0', 'https://old.example/one'),
              link('links.old.1', 'https://old.example/two'),
            ],
          },
        }),
      ),
      attribute(
        versioned(timestamp(2), { profile: { links: newerLinks } }),
      ),
    ]);

    expect(parsed?.profile?.links).toEqual(newerLinks);
  });

  test('prevents resurrection with a tombstone and clears it on a later set', () => {
    const initial = attribute(
      versioned(timestamp(1), { profile: { name: 'Alice' } }),
    );
    const removed = attribute(
      versioned(timestamp(2), { tombstones: ['profile.name'] }),
    );
    const restored = attribute(
      versioned(timestamp(3), { profile: { name: 'Alice restored' } }),
    );

    const afterRemoval = parseThreeBioMetadataAttributes([initial, removed]);

    expect(afterRemoval?.profile?.name).toBeUndefined();
    expect(afterRemoval?.tombstones).toContain('profile.name');

    const afterRestore = parseThreeBioMetadataAttributes([
      removed,
      restored,
      initial,
    ]);

    expect(afterRestore?.profile?.name).toBe('Alice restored');
    expect(afterRestore?.tombstones).toBeUndefined();
  });

  test('interprets a versioned null field as a tombstone', () => {
    const parsed = parseThreeBioMetadataAttributes([
      attribute(
        versioned(timestamp(1), { profile: { avatar: 'https://old.example' } }),
      ),
      attribute(versioned(timestamp(2), { profile: { avatar: null } })),
    ]);

    expect(parsed?.profile?.avatar).toBeUndefined();
    expect(parsed?.tombstones).toContain('profile.avatar');
  });

  test('interprets versioned null collection, theme, and setting leaves as tombstones', () => {
    const parsed = parseThreeBioMetadataAttributes([
      attribute(
        versioned(timestamp(1), {
          profile: { links: [link('links.old.0')] },
          theme: { displayBranding: false },
          settings: { subscription: { id: 'old-plan' } },
        }),
      ),
      attribute(
        versioned(timestamp(2), {
          profile: { links: null },
          theme: { displayBranding: null },
          settings: { subscription: { id: null } },
        }),
      ),
    ]);

    expect(parsed?.profile?.links).toBeUndefined();
    expect(parsed?.theme?.displayBranding).toBe(true);
    expect(parsed?.settings?.subscription.id).toBeUndefined();
    expect(parsed?.tombstones).toEqual(
      expect.arrayContaining([
        'profile.links',
        'theme.displayBranding',
        'settings.subscription.id',
      ]),
    );

    const validTombstoneAfterUnknowns = parseThreeBioMetadataAttributes([
      attribute(versioned(timestamp(1), { profile: { name: 'Old name' } })),
      attribute(
        versioned(timestamp(2), {
          tombstones: [
            ...Array.from(
              { length: THREE_BIO_METADATA_MAX_CANDIDATES },
              (_, index) => `unknown.${index}`,
            ),
            'profile.name',
          ],
        }),
      ),
    ]);

    expect(validTombstoneAfterUnknowns?.profile?.name).toBeUndefined();
    expect(validTombstoneAfterUnknowns?.tombstones).toContain('profile.name');
  });
});

describe('metadata writer', () => {
  test('emits versioned metadata, a timestamp, and compact tombstones', () => {
    const updatedAt = timestamp(4);
    const metadata = buildPersistedThreeBioMetadata({
      current: {
        profile: {
          avatar: 'https://images.example/old-avatar.png',
          coverPicture: 'https://images.example/cover.png',
        },
        tombstones: [
          'profile.avatar',
          'profile.avatar',
          'profile.linksPanelBackground',
        ],
      },
      values: defaultEditorValues,
      avatarUri: null,
      coverPictureUri: undefined,
      linksPanelBackgroundUri: 'https://images.example/panel.png',
      updatedAt,
    });

    expect(metadata.schemaVersion).toBe(THREE_BIO_METADATA_SCHEMA_VERSION);
    expect(metadata.updatedAt).toBe(updatedAt);
    expect(metadata.profile?.avatar).toBeUndefined();
    expect(metadata.profile?.coverPicture).toBe(
      'https://images.example/cover.png',
    );
    expect(metadata.profile?.linksPanelBackground).toBe(
      'https://images.example/panel.png',
    );
    expect(metadata.tombstones).toEqual(['profile.avatar']);
  });

  test('a later writer set clears an existing tombstone', () => {
    const metadata = buildPersistedThreeBioMetadata({
      current: {
        tombstones: ['profile.avatar'],
      },
      values: defaultEditorValues,
      avatarUri: 'https://images.example/restored-avatar.png',
      coverPictureUri: undefined,
      linksPanelBackgroundUri: undefined,
      updatedAt: timestamp(5),
    });

    expect(metadata.profile?.avatar).toBe(
      'https://images.example/restored-avatar.png',
    );
    expect(metadata.tombstones).toEqual([]);
  });

  test('preserves tombstones for settings the editor does not own', () => {
    const metadata = buildPersistedThreeBioMetadata({
      current: {
        settings: {
          subscription: { type: 'free' },
        },
        tombstones: ['settings.subscription.type'],
      },
      values: defaultEditorValues,
      avatarUri: undefined,
      coverPictureUri: undefined,
      linksPanelBackgroundUri: undefined,
      updatedAt: timestamp(5),
    });

    expect(metadata.tombstones).toContain('settings.subscription.type');
  });

  test('preserves latest clean editor fields while applying dirty leaves', () => {
    const currentLinks = [link('links.latest.0', 'https://latest.example')];
    const currentSocialLinks = [
      link('socialLinks.github', 'https://github.com/latest'),
    ];
    const metadata = buildPersistedThreeBioMetadata({
      current: {
        schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
        updatedAt: timestamp(4),
        profile: {
          name: 'Latest name',
          bio: 'Latest bio',
          links: currentLinks,
          socialLinks: currentSocialLinks,
        },
        theme: {
          name: 'seaside',
          displayStatistics: false,
          displayBranding: false,
        },
      },
      values: {
        ...defaultEditorValues,
        name: 'Stale name',
        bio: 'My edit',
        links: ['https://stale.example'],
        theme: 'classic',
      },
      avatarUri: undefined,
      coverPictureUri: undefined,
      linksPanelBackgroundUri: undefined,
      dirtyFields: {
        name: false,
        bio: true,
        links: false,
        socialLinks: false,
        theme: false,
        displayStatistics: false,
        displayBranding: false,
      },
      updatedAt: timestamp(5),
    });

    expect(metadata.profile).toMatchObject({
      name: 'Latest name',
      bio: 'My edit',
      links: currentLinks,
      socialLinks: currentSocialLinks,
    });
    expect(metadata.theme).toEqual({
      name: 'seaside',
      displayStatistics: false,
      displayBranding: false,
    });
  });

  test('upgrades legacy null text without changing native fallback semantics', () => {
    const legacy = parseThreeBioMetadata({
      profile: { name: null, bio: null },
    });
    const upgraded = buildPersistedThreeBioMetadata({
      current: legacy,
      values: defaultEditorValues,
      avatarUri: undefined,
      coverPictureUri: undefined,
      linksPanelBackgroundUri: undefined,
      dirtyFields: {
        name: false,
        bio: false,
        links: false,
        socialLinks: false,
        theme: false,
        displayStatistics: false,
        displayBranding: false,
      },
      updatedAt: timestamp(6),
    });
    const reparsed = parseThreeBioMetadata(upgraded);

    expect(reparsed?.profile?.name).toBeUndefined();
    expect(reparsed?.profile?.bio).toBeUndefined();
    expect(reparsed?.tombstones ?? []).not.toContain('profile.name');
    expect(reparsed?.tombstones ?? []).not.toContain('profile.bio');
  });

  test('compacts duplicate stored attributes before uploading', () => {
    const nativeAttributes = Array.from(
      { length: LENS_METADATA_MAX_ATTRIBUTES - 2 },
      (_, index) => ({
        type: ApiMetadataAttributeType.String,
        key: `native.${index}`,
        value: String(index),
      }),
    );
    const account = {
      metadata: {
        attributes: [
          ...nativeAttributes,
          {
            type: ApiMetadataAttributeType.Json,
            key: THREEBIO_ATTRIBUTE_KEY,
            value: '{"old":1}',
          },
          {
            type: ApiMetadataAttributeType.Json,
            key: THREEBIO_ATTRIBUTE_KEY,
            value: '{"old":2}',
          },
        ],
      },
    };

    const result = formatMetadataBeforeUpload(
      account,
      versioned(timestamp(6), { profile: { name: 'Latest' } }),
    );
    const stored = result.lens.attributes ?? [];

    expect(stored).toHaveLength(LENS_METADATA_MAX_ATTRIBUTES - 1);
    expect(
      stored.filter(({ key }) => key === THREEBIO_ATTRIBUTE_KEY),
    ).toHaveLength(1);
  });

  test('rejects writer output beyond metadata byte and attribute limits', () => {
    const overlongMetadata = {
      padding: 'x'.repeat(THREE_BIO_METADATA_MAX_BYTES),
    };

    expect(() =>
      formatMetadataBeforeUpload(
        { metadata: { attributes: [] } },
        overlongMetadata,
      ),
    ).toThrow(RangeError);

    const fullNativeAttributeSet = Array.from(
      { length: LENS_METADATA_MAX_ATTRIBUTES },
      (_, index) => ({
        type: ApiMetadataAttributeType.String,
        key: `native.${index}`,
        value: String(index),
      }),
    );

    expect(() =>
      formatMetadataBeforeUpload(
        { metadata: { attributes: fullNativeAttributeSet } },
        versioned(timestamp(7)),
      ),
    ).toThrow(RangeError);
  });

  test('enforces bounded strings and arrays in editor-built metadata', () => {
    expect(() =>
      buildPersistedThreeBioMetadata({
        current: {},
        values: {
          ...defaultEditorValues,
          name: 'n'.repeat(THREE_BIO_NAME_MAX_LENGTH + 1),
        },
        avatarUri: undefined,
        coverPictureUri: undefined,
        linksPanelBackgroundUri: undefined,
        updatedAt: timestamp(8),
      }),
    ).toThrow();

    expect(() =>
      buildPersistedThreeBioMetadata({
        current: {},
        values: {
          ...defaultEditorValues,
          links: Array.from(
            { length: THREE_BIO_LINKS_MAX_ITEMS + 1 },
            (_, index) => `https://example.com/${index}`,
          ),
        },
        avatarUri: undefined,
        coverPictureUri: undefined,
        linksPanelBackgroundUri: undefined,
        updatedAt: timestamp(8),
      }),
    ).toThrow();
  });
});

test('edge and client consumers project the same latest merged profile', () => {
  const account = {
    metadata: {
      name: 'Native name',
      bio: 'Native bio',
      picture: 'https://images.example/native-avatar.png',
      coverPicture: 'https://images.example/native-cover.png',
      attributes: [
        attribute(
          JSON.stringify(
            versioned(timestamp(1), {
              profile: {
                name: 'Old custom name',
                avatar: 'https://images.example/custom-avatar.png',
                socialLinks: [
                  link(
                    'socialLinks.github',
                    'https://github.com/alice',
                  ),
                ],
              },
            }),
          ),
        ),
        attribute(
          JSON.stringify(
            versioned(timestamp(2), {
              profile: { bio: 'Latest custom bio' },
              tombstones: ['profile.name', 'profile.avatar'],
            }),
          ),
        ),
      ],
    },
  };

  const client = formatToThreeBioMetadata(account);
  const edge = extractProfileFromLensAccount(account);

  expect(edge).toEqual({
    avatar: client.profile.avatar,
    bio: client.profile.bio,
    coverPicture: client.profile.coverPicture,
    name: client.profile.name,
    socialLinks: client.profile.socialLinks?.map(({ key, value }) => ({
      key,
      value,
    })),
  });
  expect(edge).toEqual({
    avatar: undefined,
    bio: 'Latest custom bio',
    coverPicture: 'https://images.example/native-cover.png',
    name: null,
    socialLinks: [
      {
        key: 'socialLinks.github',
        value: 'https://github.com/alice',
      },
    ],
  });
});
