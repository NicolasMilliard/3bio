import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

import {
  buildProfileDocumentMetadata,
  renderProfileDocumentHead,
} from '../src/features/profile/documentMetadata.ts';
import {
  extractProfileFromLensAccount,
  isProfilePageId,
  onRequest,
  replaceMetadataBlock,
} from '../functions/[pageId].ts';

const origin = 'https://3bio.social';

test('homepage ships complete crawler-visible social metadata and a 1200 × 630 image', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const image = readFileSync(new URL('../public/og.png', import.meta.url));

  expect(html).toMatch(
    /<title data-3bio-server-metadata>\s*3bio — Decentralized link in bio for Lens\s*<\/title>/,
  );
  expect(html).toContain('property="og:image"');
  expect(html).toContain('name="twitter:card"');
  expect(html).toContain('rel="canonical"');
  expect(html).toContain('<!-- 3bio-metadata:start -->');
  expect(html).toContain('<!-- 3bio-metadata:end -->');
  expect(image.subarray(1, 4).toString()).toBe('PNG');
  expect(image.readUInt32BE(16)).toBe(1200);
  expect(image.readUInt32BE(20)).toBe(630);
});

test('profile metadata uses cover, avatar, and branded fallback images in order', () => {
  const withCover = buildProfileDocumentMetadata({
    origin,
    lensHandle: 'Alice',
    profile: {
      name: 'Alice',
      coverPicture: 'https://images.example/cover.png',
      avatar: 'https://images.example/avatar.png',
    },
    status: 'ready',
  });
  const withAvatar = buildProfileDocumentMetadata({
    origin,
    lensHandle: 'Alice',
    profile: {
      coverPicture: 'http://insecure.example/cover.png',
      avatar: 'https://images.example/avatar.png',
    },
    status: 'ready',
  });
  const withFallback = buildProfileDocumentMetadata({
    origin,
    lensHandle: 'Alice',
    profile: {
      coverPicture: 'http://insecure.example/cover.png',
      avatar: 'javascript:alert(1)',
    },
    status: 'ready',
  });

  expect(withCover.socialImageKind).toBe('cover');
  expect(withCover.socialImageUrl).toBe('https://images.example/cover.png');
  expect(withCover.twitterCard).toBe('summary_large_image');
  expect(withAvatar.socialImageKind).toBe('avatar');
  expect(withAvatar.twitterCard).toBe('summary');
  expect(withFallback.socialImageKind).toBe('default');
  expect(withFallback.socialImageUrl).toBe('https://3bio.social/og.png');
  expect(withFallback.twitterCard).toBe('summary_large_image');
});

test('only ready profiles are indexable and user text is normalized and escaped', () => {
  const ready = buildProfileDocumentMetadata({
    origin,
    lensHandle: 'ALICE',
    profile: {
      name: '  Alice <Creator>  ',
      bio: 'A profile\n\nwith   normalized spacing.',
    },
    status: 'ready',
  });
  const loading = buildProfileDocumentMetadata({
    origin,
    lensHandle: 'alice',
    status: 'loading',
  });
  const error = buildProfileDocumentMetadata({
    origin,
    lensHandle: 'alice',
    status: 'error',
  });
  const head = renderProfileDocumentHead(ready);

  expect(ready.canonicalUrl).toBe('https://3bio.social/alice');
  expect(ready.description).toBe('A profile with normalized spacing.');
  expect(ready.isIndexable).toBe(true);
  expect(loading.robots).toBe('noindex, nofollow');
  expect(loading.isIndexable).toBe(false);
  expect(error.robots).toBe('noindex, nofollow');
  expect(head).toContain('Alice &lt;Creator&gt; (@alice) | 3bio');
  expect(head).not.toContain('Alice <Creator>');
});

test('edge profile parsing preserves native Lens fields and valid 3bio overrides', () => {
  const nativeAccount = {
    metadata: {
      name: 'Native name',
      bio: 'Native bio',
      picture: 'https://images.example/native-avatar.png',
      coverPicture: 'https://images.example/native-cover.png',
      attributes: [],
    },
  };
  const customizedAccount = {
    metadata: {
      ...nativeAccount.metadata,
      attributes: [
        {
          key: '3bio',
          value: JSON.stringify({
            profile: {
              name: '3bio name',
              bio: '3bio bio',
              avatar: 'https://images.example/3bio-avatar.png',
              socialLinks: [
                {
                  key: 'socialLinks.github',
                  value: 'https://github.com/alice',
                },
              ],
            },
          }),
        },
      ],
    },
  };

  expect(extractProfileFromLensAccount(nativeAccount)).toEqual({
    avatar: 'https://images.example/native-avatar.png',
    bio: 'Native bio',
    coverPicture: 'https://images.example/native-cover.png',
    name: 'Native name',
    socialLinks: undefined,
  });
  expect(extractProfileFromLensAccount(customizedAccount)).toEqual({
    avatar: 'https://images.example/3bio-avatar.png',
    bio: '3bio bio',
    coverPicture: 'https://images.example/native-cover.png',
    name: '3bio name',
    socialLinks: [
      {
        key: 'socialLinks.github',
        value: 'https://github.com/alice',
      },
    ],
  });
});

test('edge rewriting replaces only the marked metadata block', () => {
  const source =
    '<html><head><!-- 3bio-metadata:start --><title>Old</title><!-- 3bio-metadata:end --></head><body>App</body></html>';
  const rewritten = replaceMetadataBlock(source, '<title>Alice | 3bio</title>');

  expect(rewritten).toContain('<title>Alice | 3bio</title>');
  expect(rewritten).not.toContain('<title>Old</title>');
  expect(rewritten).toContain('<body>App</body>');
});

test('edge routing accepts dotted Lens handles but skips static files', () => {
  expect(isProfilePageId('alice.lens')).toBe(true);
  expect(isProfilePageId('alice_creator-1')).toBe(true);
  expect(isProfilePageId('favicon.ico')).toBe(false);
  expect(isProfilePageId('favicon.svg')).toBe(false);
  expect(isProfilePageId('og.png')).toBe(false);
  expect(isProfilePageId('---')).toBe(false);
});

test('edge routing canonicalizes host, handle casing, and trailing slashes', async () => {
  const response = await onRequest({
    request: new Request('https://www.3bio.social/ALICE/?ref=share'),
    params: { pageId: 'ALICE' },
    next: () => {
      throw new Error('Canonical redirects must not fetch the app shell.');
    },
  });

  expect(response.status).toBe(308);
  expect(response.headers.get('location')).toBe(
    'https://3bio.social/alice?ref=share',
  );
});
