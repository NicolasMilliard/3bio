import { expect, test } from 'bun:test';

import {
  getImageUploadConstraintError,
  IMAGE_UPLOAD_MAX_BYTES,
  validateImageUpload,
} from '../src/features/editor/schemas/imageUpload.schema.ts';

const imageFile = (bytes, type) =>
  new File([Uint8Array.from(bytes)], 'profile-image', { type });

const jpegBytes = [0xff, 0xd8, 0xff, 0xdb, 0, 0, 0, 0, 0, 0, 0, 0];
const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const webpBytes = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
const avifBytes = [
  0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0, 0, 0, 0, 0x6d,
  0x69, 0x66, 0x31, 0x6d, 0x69, 0x61, 0x66,
];
const avifCompatibleBrandBytes = [
  0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31, 0, 0, 0, 0, 0x6d,
  0x69, 0x61, 0x66, 0x61, 0x76, 0x69, 0x66,
];
const avifSequenceBytes = [
  0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x73, 0, 0, 0, 0, 0x6d,
  0x73, 0x66, 0x31,
];
const nonAvifIsoBmffBytes = [
  0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0, 0, 0, 0x6d,
  0x69, 0x66, 0x31,
];

test('allows the exact image-size boundary and rejects anything larger', () => {
  expect(
    getImageUploadConstraintError({
      size: IMAGE_UPLOAD_MAX_BYTES,
      type: 'image/jpeg',
    }),
  ).toBeNull();

  expect(
    getImageUploadConstraintError({
      size: IMAGE_UPLOAD_MAX_BYTES + 1,
      type: 'image/jpeg',
    }),
  ).toBe('Choose an image no larger than 5 MB.');
});

test('only JPEG, PNG, WebP, and AVIF files are accepted', () => {
  expect(
    getImageUploadConstraintError({ size: 1, type: 'image/png' }),
  ).toBeNull();
  expect(
    getImageUploadConstraintError({ size: 1, type: 'image/webp' }),
  ).toBeNull();
  expect(
    getImageUploadConstraintError({ size: 1, type: 'image/avif' }),
  ).toBeNull();
  expect(getImageUploadConstraintError({ size: 1, type: 'image/heic' })).toBe(
    'HEIC and HEIF images are not supported. Convert the image to JPEG, PNG, WebP, or AVIF first.',
  );
  expect(getImageUploadConstraintError({ size: 1, type: 'image/heif' })).toBe(
    'HEIC and HEIF images are not supported. Convert the image to JPEG, PNG, WebP, or AVIF first.',
  );
  expect(
    getImageUploadConstraintError({ size: 1, type: 'image/heic-sequence' }),
  ).toBe(
    'HEIC and HEIF images are not supported. Convert the image to JPEG, PNG, WebP, or AVIF first.',
  );
  expect(getImageUploadConstraintError({ size: 1, type: '' })).toBe(
    'Use a JPEG, PNG, WebP, or AVIF image.',
  );
});

test('rejects empty files', () => {
  expect(getImageUploadConstraintError({ size: 0, type: 'image/jpeg' })).toBe(
    'Choose a non-empty image file.',
  );
});

test('checks signatures and permits images up to 4096 pixels per side', async () => {
  const dimensions = async () => ({ width: 4096, height: 4096 });

  expect(
    await validateImageUpload(imageFile(jpegBytes, 'image/jpeg'), dimensions),
  ).toBeNull();
  expect(
    await validateImageUpload(imageFile(pngBytes, 'image/png'), dimensions),
  ).toBeNull();
  expect(
    await validateImageUpload(imageFile(webpBytes, 'image/webp'), dimensions),
  ).toBeNull();
  expect(
    await validateImageUpload(imageFile(avifBytes, 'image/avif'), dimensions),
  ).toBeNull();
  expect(
    await validateImageUpload(
      imageFile(avifSequenceBytes, 'image/avif'),
      dimensions,
    ),
  ).toBeNull();
  expect(
    await validateImageUpload(
      imageFile(avifCompatibleBrandBytes, 'image/avif'),
      dimensions,
    ),
  ).toBeNull();
});

test('rejects mismatched file signatures before decoding', async () => {
  expect(
    await validateImageUpload(imageFile(pngBytes, 'image/jpeg'), async () => ({
      width: 100,
      height: 100,
    })),
  ).toBe('The file contents do not match its image format.');
  expect(
    await validateImageUpload(
      imageFile(nonAvifIsoBmffBytes, 'image/avif'),
      async () => ({
        width: 100,
        height: 100,
      }),
    ),
  ).toBe('The file contents do not match its image format.');
  expect(
    await validateImageUpload(
      imageFile(avifBytes.slice(0, 16), 'image/avif'),
      async () => ({
        width: 100,
        height: 100,
      }),
    ),
  ).toBe('The file contents do not match its image format.');
});

test('rejects corrupt and over-dimension images', async () => {
  expect(
    await validateImageUpload(imageFile(jpegBytes, 'image/jpeg'), async () => {
      throw new Error('decode failed');
    }),
  ).toBe('Choose a valid JPEG, PNG, WebP, or AVIF image.');

  expect(
    await validateImageUpload(imageFile(jpegBytes, 'image/jpeg'), async () => ({
      width: 4097,
      height: 100,
    })),
  ).toBe('Choose an image no larger than 4096 × 4096 pixels.');
});
