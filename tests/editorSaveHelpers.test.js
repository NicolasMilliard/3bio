import { expect, test } from 'bun:test';

import { THREE_BIO_DEFAULT_THEME } from '../src/constants/themes.ts';
import { buildPersistedThreeBioMetadata } from '../src/features/editor/helpers/buildPersistedThreeBioMetadata.ts';
import { getTransactionFailureReason } from '../src/features/editor/helpers/getTransactionFailureReason.ts';
import { toLinkAttributes } from '../src/features/editor/helpers/metadataAttributes.ts';
import { formatToThreeBioMetadata } from '../src/helpers/formatToThreeBioMetadata.ts';
import { parseThreeBioMetadata } from '../src/helpers/parseThreeBioMetadata.ts';

test('only TransactionWillFail is treated as an immediate Lens failure', () => {
  expect(
    getTransactionFailureReason({
      __typename: 'TransactionWillFail',
      reason: 'Simulation reverted',
    }),
  ).toBe('Simulation reverted');

  expect(
    getTransactionFailureReason({
      __typename: 'SponsoredTransactionRequest',
      reason: 'Sponsored by the app',
    }),
  ).toBeNull();

  expect(
    getTransactionFailureReason({
      __typename: 'SelfFundedTransactionRequest',
      reason: 'Sponsorship unavailable',
    }),
  ).toBeNull();

  expect(
    getTransactionFailureReason({
      __typename: 'SetAccountMetadataResponse',
    }),
  ).toBeNull();
});

test('saved links on the same hostname receive distinct metadata keys', () => {
  const attributes = toLinkAttributes([
    'https://example.com/first',
    'https://example.com/second',
  ]);

  expect(attributes.map(({ key }) => key)).toEqual([
    'links.example.com.0',
    'links.example.com.1',
  ]);
  expect(new Set(attributes.map(({ key }) => key)).size).toBe(2);
});

test('editor output round-trips through the persisted metadata reader', () => {
  const values = {
    name: 'Alice',
    bio: 'Creator',
    socialLinks: [
      {
        platform: 'github',
        url: 'https://github.com/alice',
      },
    ],
    links: ['https://example.com'],
    theme: THREE_BIO_DEFAULT_THEME,
    displayStatistics: false,
    displayBranding: true,
  };
  const metadata = buildPersistedThreeBioMetadata({
    current: {
      settings: {
        subscription: {
          type: 'free',
        },
      },
    },
    values,
    avatarUri: 'https://images.example/avatar.png',
    coverPictureUri: null,
    linksPanelBackgroundUri:
      'https://images.example/links-panel-background.webp',
  });

  expect(metadata.profile?.linksPanelBackground).toBe(
    'https://images.example/links-panel-background.webp',
  );
  expect(parseThreeBioMetadata(JSON.stringify(metadata))).toEqual(metadata);

  for (const avatarUri of [
    'ipfs://example/avatar.png',
    'lens://example/avatar.png',
    'javascript:alert(1)',
    'blob:https://3bio.social/local-preview',
  ]) {
    expect(() =>
      buildPersistedThreeBioMetadata({
        current: {},
        values,
        avatarUri,
        coverPictureUri: null,
        linksPanelBackgroundUri: null,
      }),
    ).toThrow();
  }

  expect(() =>
    buildPersistedThreeBioMetadata({
      current: {},
      values,
      avatarUri: null,
      coverPictureUri: null,
      linksPanelBackgroundUri: 'javascript:alert(1)',
    }),
  ).toThrow();
});

test('removing a links panel background omits it from persisted metadata', () => {
  const metadata = buildPersistedThreeBioMetadata({
    current: {
      profile: {
        linksPanelBackground: 'https://images.example/old-panel.webp',
      },
    },
    values: {
      theme: THREE_BIO_DEFAULT_THEME,
      displayStatistics: true,
      displayBranding: true,
    },
    avatarUri: null,
    coverPictureUri: null,
    linksPanelBackgroundUri: null,
  });

  expect(metadata.profile?.linksPanelBackground).toBeUndefined();
});

test('stored links panel backgrounds hydrate into the profile view model', () => {
  const linksPanelBackground =
    'https://images.example/links-panel-background.webp';
  const metadata = formatToThreeBioMetadata({
    metadata: {
      attributes: [
        {
          key: '3bio',
          value: JSON.stringify({ profile: { linksPanelBackground } }),
        },
      ],
    },
  });

  expect(metadata.profile.linksPanelBackground).toBe(linksPanelBackground);
});
