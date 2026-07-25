import { expect, test } from 'bun:test';
import { MetadataAttributeType } from '@lens-protocol/metadata';

import { SOCIAL_MAP, THREE_BIO_DEFAULT_THEME } from '../src/constants/index.ts';
import { socialLinkSchema } from '../src/features/editor/schemas/metadataForm.schema.ts';
import { profileCheckingFormSchema } from '../src/features/homepage/schema/profileCheckingForm.schema.ts';
import { formatSocialLink } from '../src/helpers/formatSocialLink.ts';
import { formatUrlLabel } from '../src/helpers/formatUrlLabel.ts';
import { isValidUrl } from '../src/helpers/isValidUrl.ts';
import { parseThreeBioMetadata } from '../src/helpers/parseThreeBioMetadata.ts';
import { httpUrlSchema } from '../src/schemas/httpUrl.schema.ts';

test('HTTP URL validation rejects malformed values and unsafe schemes without throwing', () => {
  const invalidValues = [
    '',
    'not-a-url',
    'https://',
    'javascript:alert(1)',
    'data:text/html,hello',
    'mailto:hello@example.com',
    'ftp://example.com/file',
  ];

  for (const value of invalidValues) {
    expect(() => httpUrlSchema.safeParse(value)).not.toThrow();
    expect(httpUrlSchema.safeParse(value).success).toBe(false);
    expect(isValidUrl(value)).toBe(false);
  }
});

test('HTTP URL validation and the editor helper accept the same normalized URLs', () => {
  for (const value of [
    'https://example.com/path',
    'http://localhost:5173/profile',
    '  https://example.com/trimmed  ',
  ]) {
    const result = httpUrlSchema.safeParse(value);

    expect(result.success).toBe(true);
    expect(isValidUrl(value)).toBe(true);
  }

  expect(httpUrlSchema.parse('  https://example.com/trimmed  ')).toBe(
    'https://example.com/trimmed',
  );
});

test('an empty social URL remains valid when a user removes a link', () => {
  expect(() =>
    socialLinkSchema.safeParse({ platform: 'github', url: '' }),
  ).not.toThrow();
  expect(
    socialLinkSchema.safeParse({ platform: 'github', url: '' }).success,
  ).toBe(true);
});

test('social links accept canonical host variants and reject mismatched hosts', () => {
  expect(
    SOCIAL_MAP.instagram.validateUrl('https://www.Instagram.com/alice'),
  ).toBe(true);
  expect(
    SOCIAL_MAP.youtube.validateUrl(
      'https://www.youtube.com/channel/channel-id',
    ),
  ).toBe(true);
  expect(SOCIAL_MAP.mastodon.validateUrl('https://fosstodon.org/@alice')).toBe(
    true,
  );

  expect(SOCIAL_MAP.github.validateUrl('https://github.com/')).toBe(false);
  expect(
    SOCIAL_MAP.github.validateUrl('https://github.com.evil.example/alice'),
  ).toBe(false);
  expect(SOCIAL_MAP.github.validateUrl('http://github.com/alice')).toBe(false);

  expect(
    socialLinkSchema.safeParse({
      platform: 'github',
      url: 'https://instagram.com/alice',
    }).success,
  ).toBe(false);
});

test('stored social keys cannot assign a trusted icon to another hostname', () => {
  expect(
    formatSocialLink({
      key: 'socialLinks.github',
      value: 'https://instagram.com/alice',
    }).platform,
  ).toBe('instagram');

  expect(
    formatSocialLink({
      key: 'socialLinks.github',
      value: 'https://github.com.evil.example/alice',
    }).platform,
  ).toBeUndefined();
});

test('malformed stored metadata is discarded instead of crashing a route', () => {
  const invalidMetadata = JSON.stringify({
    profile: {
      links: [
        {
          type: MetadataAttributeType.STRING,
          key: 'links.example',
          value: 'javascript:alert(1)',
        },
      ],
    },
  });

  expect(() => parseThreeBioMetadata(invalidMetadata)).not.toThrow();
  expect(parseThreeBioMetadata(invalidMetadata)).toBeUndefined();

  const validMetadata = {
    profile: {
      links: [
        {
          type: MetadataAttributeType.STRING,
          key: 'links.example.com.0',
          value: 'https://example.com',
        },
      ],
    },
    theme: {
      name: THREE_BIO_DEFAULT_THEME,
      displayStatistics: true,
      displayBranding: true,
    },
  };

  expect(parseThreeBioMetadata(JSON.stringify(validMetadata))).toEqual(
    validMetadata,
  );
});

test('homepage profile input strips only the real 3bio origin', () => {
  expect(
    profileCheckingFormSchema.parse({
      link: 'https://www.3bio.social/Alice/',
    }).link,
  ).toBe('Alice');
  expect(profileCheckingFormSchema.parse({ link: '/alice/' }).link).toBe(
    'alice',
  );

  for (const link of [
    'https://3bio.social.evil/alice',
    'https://3bio.socialevil/alice',
    '.',
    '---',
  ]) {
    expect(profileCheckingFormSchema.safeParse({ link }).success).toBe(false);
  }
});

test('URL labels include the visible port, query, and fragment', () => {
  expect(formatUrlLabel('https://example.com:8443/path/?view=full#bio')).toBe(
    'example.com:8443/path?view=full#bio',
  );
});
