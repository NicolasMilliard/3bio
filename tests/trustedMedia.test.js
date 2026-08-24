import { expect, test } from 'bun:test';

import {
  GROVE_MEDIA_ORIGIN,
  getTrustedMediaUrl,
} from '../src/lib/trustedMedia.ts';

test('trusted profile media is limited to Grove and same-origin assets', () => {
  expect(getTrustedMediaUrl(`${GROVE_MEDIA_ORIGIN}/resource/avatar.png`)).toBe(
    `${GROVE_MEDIA_ORIGIN}/resource/avatar.png`,
  );
  expect(getTrustedMediaUrl('/og.png')).toBe('/og.png');
  expect(
    getTrustedMediaUrl('https://3bio.social/media/avatar.png', {
      siteOrigin: 'https://3bio.social',
    }),
  ).toBe('https://3bio.social/media/avatar.png');
});

test('profile media rejects arbitrary, insecure, and scheme-relative origins', () => {
  expect(getTrustedMediaUrl('https://tracker.example/pixel.gif')).toBeUndefined();
  expect(getTrustedMediaUrl('http://api.grove.storage/avatar.png')).toBeUndefined();
  expect(getTrustedMediaUrl('//tracker.example/pixel.gif')).toBeUndefined();
  expect(getTrustedMediaUrl('/\\tracker.example/pixel.gif')).toBeUndefined();
  expect(getTrustedMediaUrl('data:image/svg+xml,<svg/>')).toBeUndefined();
  expect(getTrustedMediaUrl('javascript:alert(1)')).toBeUndefined();
});

test('blob media is available only to explicit editor previews', () => {
  const previewUrl = 'blob:https://3bio.social/preview-id';

  expect(getTrustedMediaUrl(previewUrl)).toBeUndefined();
  expect(getTrustedMediaUrl(previewUrl, { allowBlob: true })).toBe(previewUrl);
});
