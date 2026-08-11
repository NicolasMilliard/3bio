import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

import {
  buildProfileDocumentMetadata,
  NOINDEX_ROBOTS,
  PAGE_NOT_FOUND_TITLE,
  renderPageNotFoundDocumentHead,
  renderProfileDocumentHead,
} from '../src/features/profile/documentMetadata.ts';
import {
  extractProfileFromLensAccount,
  isProfilePageId,
  onRequest,
  replaceMetadataBlock,
} from '../functions/[[path]].ts';

const origin = 'https://3bio.social';
const shellHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const createShellResponse = () =>
  new Response(shellHtml, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });

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
  const notFound = buildProfileDocumentMetadata({
    origin,
    lensHandle: 'alice',
    status: 'not-found',
  });
  const head = renderProfileDocumentHead(ready);
  const notFoundHead = renderProfileDocumentHead(notFound);

  expect(ready.canonicalUrl).toBe('https://3bio.social/alice');
  expect(ready.description).toBe('A profile with normalized spacing.');
  expect(ready.isIndexable).toBe(true);
  expect(loading.robots).toBe('noindex, nofollow');
  expect(loading.isIndexable).toBe(false);
  expect(error.robots).toBe('noindex, nofollow');
  expect(notFound.robots).toBe(NOINDEX_ROBOTS);
  expect(notFound.isIndexable).toBe(false);
  expect(notFoundHead).not.toContain('rel="canonical"');
  expect(notFoundHead).not.toContain('property="og:');
  expect(notFoundHead).not.toContain('application/ld+json');
  expect(head).toContain('Alice &lt;Creator&gt; (@alice) | 3bio');
  expect(head).not.toContain('Alice <Creator>');
});

test('generic not-found metadata is crawler-visible and never indexable', () => {
  const head = renderPageNotFoundDocumentHead();

  expect(head).toContain(PAGE_NOT_FOUND_TITLE);
  expect(head).toContain('name="description"');
  expect(head).toContain(`name="robots" content="${NOINDEX_ROBOTS}"`);
  expect(head).not.toContain('rel="canonical"');
  expect(head).not.toContain('property="og:');
  expect(head).not.toContain('application/ld+json');
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

test('edge routing accepts released and dotted Lens handles but skips reserved paths and static files', () => {
  expect(isProfilePageId('alice.lens')).toBe(true);
  expect(isProfilePageId('alice_creator-1')).toBe(true);
  expect(isProfilePageId('app')).toBe(true);
  expect(isProfilePageId('dashboard')).toBe(true);
  expect(isProfilePageId('edit')).toBe(true);
  expect(isProfilePageId('favicon.ico')).toBe(false);
  expect(isProfilePageId('favicon.svg')).toBe(false);
  expect(isProfilePageId('og.png')).toBe(false);
  expect(isProfilePageId('---')).toBe(false);
});

test('edge routing canonicalizes host, handle casing, and trailing slashes', async () => {
  const response = await onRequest({
    request: new Request('https://www.3bio.social/ALICE/?ref=share'),
    params: { path: ['ALICE'] },
    next: () => {
      throw new Error('Canonical redirects must not fetch the app shell.');
    },
  });

  expect(response.status).toBe(308);
  expect(response.headers.get('location')).toBe(
    'https://3bio.social/alice?ref=share',
  );
});

test('edge routing returns a generic HTML 404 with noindex for invalid and multi-segment paths', async () => {
  const requests = [
    {
      url: 'https://3bio.social/---',
      path: ['---'],
    },
    {
      url: 'https://3bio.social/unknown/extra',
      path: ['unknown', 'extra'],
    },
    {
      url: 'https://3bio.social/app/unknown',
      path: ['app', 'unknown'],
    },
  ];

  for (const { url, path } of requests) {
    const response = await onRequest({
      request: new Request(url),
      params: { path },
      next: async () => createShellResponse(),
    });
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get('x-robots-tag')).toBe(NOINDEX_ROBOTS);
    expect(html).toContain(PAGE_NOT_FOUND_TITLE);
    expect(html).toContain(`name="robots" content="${NOINDEX_ROBOTS}"`);
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('property="og:title"');
  }
});

test('generic edge 404 responses honor HEAD semantics', async () => {
  const response = await onRequest({
    request: new Request('https://3bio.social/unknown/extra', {
      method: 'HEAD',
    }),
    params: { path: ['unknown', 'extra'] },
    next: async () => createShellResponse(),
  });

  expect(response.status).toBe(404);
  expect(response.headers.get('x-robots-tag')).toBe(NOINDEX_ROBOTS);
  expect(await response.text()).toBe('');
});

test('known internal app routes pass through with an HTTP noindex header', async () => {
  const internalRoutes = [
    { url: 'https://3bio.social/app/dashboard', path: ['app', 'dashboard'] },
    { url: 'https://3bio.social/app/edit', path: ['app', 'edit'] },
  ];

  for (const internalRoute of internalRoutes) {
    const response = await onRequest({
      request: new Request(internalRoute.url),
      params: { path: internalRoute.path },
      next: async () => createShellResponse(),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe(NOINDEX_ROBOTS);
  }
});

test('missing profiles return a real 404 with profile-specific noindex metadata', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { account: null } }), {
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const response = await onRequest({
      request: new Request('https://3bio.social/missing'),
      params: { path: ['missing'] },
      next: async () => createShellResponse(),
    });
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get('x-robots-tag')).toBe(NOINDEX_ROBOTS);
    expect(html).toContain('Profile not found | 3bio');
    expect(html).toContain(`name="robots" content="${NOINDEX_ROBOTS}"`);
    expect(html).not.toContain('rel="canonical"');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('app, dashboard, and edit handles use the profile edge pipeline', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_request, options) => {
    const body = JSON.parse(options.body);
    const localName = body.variables.request.username.localName;

    return new Response(
      JSON.stringify({
        data: {
          account: {
            username: { localName },
            metadata: { name: `${localName} profile`, attributes: [] },
          },
        },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    for (const handle of ['app', 'dashboard', 'edit']) {
      const response = await onRequest({
        request: new Request(`https://3bio.social/${handle}`),
        params: { path: [handle] },
        next: async () => createShellResponse(),
      });
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('x-robots-tag')).toBeNull();
      expect(html).toContain(`rel="canonical" href="${origin}/${handle}"`);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deployment routing sends dynamic URLs through the catch-all and noindexes app pages', () => {
  const routes = JSON.parse(
    readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'),
  );
  const headers = readFileSync(
    new URL('../public/_headers', import.meta.url),
    'utf8',
  );
  const robots = readFileSync(
    new URL('../public/robots.txt', import.meta.url),
    'utf8',
  );

  expect(routes.include).toEqual(['/*']);
  expect(routes.exclude).not.toContain('/dashboard');
  expect(routes.exclude).not.toContain('/dashboard/*');
  expect(routes.exclude).not.toContain('/edit');
  expect(routes.exclude).not.toContain('/edit/*');
  expect(routes.exclude).not.toContain('/app');
  expect(routes.exclude).not.toContain('/app/*');
  expect(headers).not.toMatch(/^\/app\n  X-Robots-Tag: noindex, nofollow$/m);
  expect(headers).toMatch(/^\/app\/\*\n  X-Robots-Tag: noindex, nofollow$/m);
  expect(robots).not.toContain('Disallow:');
});
