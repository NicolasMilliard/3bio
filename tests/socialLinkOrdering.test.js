import { expect, test } from 'bun:test';

import { SOCIAL_MAP } from '../src/constants/platforms.ts';
import {
  activateSocialLink,
  deactivateSocialLink,
  hydrateSocialLinks,
  reorderActiveSocialLinks,
} from '../src/features/editor/helpers/socialLinkOrdering.ts';
import { toSocialLinkAttributes } from '../src/features/editor/helpers/metadataAttributes.ts';

const activePlatforms = (socialLinks) =>
  socialLinks
    .filter(({ url }) => Boolean(url?.trim()))
    .map(({ platform }) => platform);

test('persisted social links hydrate in stored order and append each inactive platform once', () => {
  const socialLinks = hydrateSocialLinks([
    {
      key: 'socialLinks.youtube',
      value: 'https://youtube.com/@alice',
    },
    {
      key: 'socialLinks.youtube',
      value: 'https://youtube.com/@duplicate',
    },
    {
      key: 'socialLinks.github',
      value: 'https://github.com.evil.example/alice',
    },
    {
      key: 'socialLinks.github',
      value: 'https://github.com/alice',
    },
    {
      key: 'socialLinks.unknown',
      value: 'https://example.com/alice',
    },
  ]);
  const platforms = socialLinks.map(({ platform }) => platform);

  expect(activePlatforms(socialLinks)).toEqual(['youtube', 'github']);
  expect(platforms.slice(0, 2)).toEqual(['youtube', 'github']);
  expect(platforms).toHaveLength(Object.keys(SOCIAL_MAP).length);
  expect(new Set(platforms).size).toBe(Object.keys(SOCIAL_MAP).length);
  expect(platforms.slice(2)).toEqual(
    Object.keys(SOCIAL_MAP).filter(
      (platform) => platform !== 'youtube' && platform !== 'github',
    ),
  );
});

test('active social links reorder by platform ID and leave inactive links at the end', () => {
  const socialLinks = [
    { platform: 'github', url: 'https://github.com/alice' },
    { platform: 'twitter', url: '' },
    { platform: 'youtube', url: 'https://youtube.com/@alice' },
    { platform: 'instagram', url: 'https://instagram.com/alice' },
    { platform: 'facebook', url: undefined },
  ];

  const reordered = reorderActiveSocialLinks(
    socialLinks,
    'instagram',
    'github',
  );

  expect(reordered.map(({ platform }) => platform)).toEqual([
    'instagram',
    'github',
    'youtube',
    'twitter',
    'facebook',
  ]);
  expect(activePlatforms(reordered)).toEqual([
    'instagram',
    'github',
    'youtube',
  ]);
  expect(
    reorderActiveSocialLinks(reordered, 'instagram', 'youtube').map(
      ({ platform }) => platform,
    ),
  ).toEqual(['github', 'youtube', 'instagram', 'twitter', 'facebook']);
  expect(socialLinks.map(({ platform }) => platform)).toEqual([
    'github',
    'twitter',
    'youtube',
    'instagram',
    'facebook',
  ]);
});

test('active social links can move toward the end of the sequence', () => {
  const reordered = reorderActiveSocialLinks(
    [
      { platform: 'github', url: 'https://github.com/alice' },
      { platform: 'youtube', url: 'https://youtube.com/@alice' },
      { platform: 'instagram', url: 'https://instagram.com/alice' },
      { platform: 'twitter', url: undefined },
    ],
    'github',
    'instagram',
  );

  expect(activePlatforms(reordered)).toEqual([
    'youtube',
    'instagram',
    'github',
  ]);
});

test('activating a platform appends it after the active social links', () => {
  const socialLinks = [
    { platform: 'github', url: 'https://github.com/alice' },
    { platform: 'twitter', url: undefined },
    { platform: 'youtube', url: 'https://youtube.com/@alice' },
    { platform: 'instagram', url: '' },
  ];

  const activated = activateSocialLink(
    socialLinks,
    'twitter',
    'https://x.com/alice',
  );

  expect(activated.map(({ platform }) => platform)).toEqual([
    'github',
    'youtube',
    'twitter',
    'instagram',
  ]);
  expect(activePlatforms(activated)).toEqual(['github', 'youtube', 'twitter']);
  expect(activated[2].url).toBe('https://x.com/alice');
});

test('deactivating a platform moves it directly after the remaining active links', () => {
  const socialLinks = [
    { platform: 'github', url: 'https://github.com/alice' },
    { platform: 'youtube', url: 'https://youtube.com/@alice' },
    { platform: 'twitter', url: undefined },
    { platform: 'instagram', url: '' },
  ];

  const deactivated = deactivateSocialLink(socialLinks, 'github');

  expect(deactivated.map(({ platform }) => platform)).toEqual([
    'youtube',
    'github',
    'twitter',
    'instagram',
  ]);
  expect(activePlatforms(deactivated)).toEqual(['youtube']);
  expect(deactivated[1].url).toBe('');
});

test('reordered active links serialize and hydrate in the chosen order', () => {
  const reordered = reorderActiveSocialLinks(
    [
      { platform: 'github', url: 'https://github.com/alice' },
      { platform: 'youtube', url: 'https://youtube.com/@alice' },
      { platform: 'twitter', url: undefined },
    ],
    'youtube',
    'github',
  );
  const persisted = toSocialLinkAttributes(reordered);

  expect(persisted.map(({ key }) => key)).toEqual([
    'socialLinks.youtube',
    'socialLinks.github',
  ]);
  expect(activePlatforms(hydrateSocialLinks(persisted))).toEqual([
    'youtube',
    'github',
  ]);
});
