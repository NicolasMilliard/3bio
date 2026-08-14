import { expect, test } from 'bun:test';

import { THREE_BIO_DEFAULT_THEME } from '../src/constants/themes.ts';
import {
  buildEditorFormDefaultValues,
  buildSavedEditorFormValues,
  getPersistedThreeBioDirtyFields,
} from '../src/features/editor/helpers/editorFormValues.ts';

test('editor form values start with stable profile defaults', () => {
  const values = buildEditorFormDefaultValues({});

  expect(values).toMatchObject({
    _imageValidation: {
      avatar: false,
      coverPicture: false,
      linksPanelBackground: false,
    },
    avatar: { preview: null },
    coverPicture: { preview: null },
    linksPanelBackground: { preview: null },
    name: '',
    bio: '',
    links: [],
    theme: THREE_BIO_DEFAULT_THEME,
    displayStatistics: true,
    displayBranding: true,
  });
  expect(values.socialLinks).toHaveLength(12);
  expect(values.socialLinks.every(({ url }) => url === undefined)).toBe(true);
});

test('editor form values hydrate persisted profile and theme fields', () => {
  const values = buildEditorFormDefaultValues({
    profile: {
      avatar: 'https://images.example/avatar.png',
      coverPicture: 'https://images.example/cover.png',
      linksPanelBackground: 'https://images.example/panel.png',
      name: 'Alice',
      bio: 'Creator',
      socialLinks: [
        {
          type: 'String',
          key: 'social.github',
          value: 'https://github.com/alice',
          platform: 'github',
        },
      ],
      links: [
        {
          type: 'String',
          key: 'links.example.0',
          value: 'https://example.com',
        },
      ],
    },
    theme: {
      name: 'midnight',
      displayStatistics: false,
      displayBranding: false,
    },
  });

  expect(values).toMatchObject({
    avatar: { preview: 'https://images.example/avatar.png' },
    coverPicture: { preview: 'https://images.example/cover.png' },
    linksPanelBackground: { preview: 'https://images.example/panel.png' },
    name: 'Alice',
    bio: 'Creator',
    links: ['https://example.com'],
    theme: 'midnight',
    displayStatistics: false,
    displayBranding: false,
  });
  expect(values.socialLinks[0]).toEqual({
    platform: 'github',
    url: 'https://github.com/alice',
  });
});

test('saved values use native fallbacks unless a custom tombstone clears them', () => {
  const account = {
    metadata: {
      picture: 'https://images.example/native-avatar.png',
      coverPicture: 'https://images.example/native-cover.png',
      name: 'Native name',
      bio: 'Native bio',
    },
  };

  const inherited = buildSavedEditorFormValues(account, {
    profile: { bio: 'Custom bio' },
  });

  expect(inherited).toMatchObject({
    avatar: { preview: 'https://images.example/native-avatar.png' },
    coverPicture: { preview: 'https://images.example/native-cover.png' },
    name: 'Native name',
    bio: 'Custom bio',
  });

  const cleared = buildSavedEditorFormValues(account, {
    tombstones: [
      'profile.avatar',
      'profile.coverPicture',
      'profile.name',
      'profile.bio',
    ],
  });

  expect(cleared).toMatchObject({
    avatar: { preview: null },
    coverPicture: { preview: null },
    name: '',
    bio: '',
  });
});

test('persisted dirty fields collapse nested form state to editor-owned flags', () => {
  expect(
    getPersistedThreeBioDirtyFields({
      avatar: { preview: true },
      name: true,
      socialLinks: [{ url: true }],
      links: [true],
      theme: true,
      displayBranding: true,
    }),
  ).toEqual({
    name: true,
    bio: false,
    socialLinks: true,
    links: true,
    theme: true,
    displayStatistics: false,
    displayBranding: true,
  });
});
