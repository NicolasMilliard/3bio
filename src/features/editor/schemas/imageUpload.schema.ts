import { z } from 'zod';

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_UPLOAD_MAX_DIMENSION = 4096;
export const IMAGE_UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
export const IMAGE_UPLOAD_HELP_TEXT =
  'JPEG, PNG, WebP, or AVIF. Max 5 MB and 4096 × 4096 px.';

const supportedImageTypes = new Set(IMAGE_UPLOAD_ACCEPT.split(','));
const unsupportedAppleImageTypes = new Set([
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
]);
const IMAGE_VALIDATION_TIMEOUT_MS = 10_000;
const IMAGE_SIGNATURE_READ_BYTES = 4096;
const avifBrands = new Set(['avif', 'avis']);

type ImageDimensions = {
  width: number;
  height: number;
};

type ReadImageDimensions = (file: File) => Promise<ImageDimensions>;

export const getImageUploadConstraintError = (
  file: Pick<File, 'size' | 'type'>,
) => {
  if (file.size === 0) {
    return 'Choose a non-empty image file.';
  }

  if (unsupportedAppleImageTypes.has(file.type.toLowerCase())) {
    return 'HEIC and HEIF images are not supported. Convert the image to JPEG, PNG, WebP, or AVIF first.';
  }

  if (!supportedImageTypes.has(file.type.toLowerCase())) {
    return 'Use a JPEG, PNG, WebP, or AVIF image.';
  }

  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return 'Choose an image no larger than 5 MB.';
  }

  return null;
};

const readFourCharacterCode = (bytes: Uint8Array, offset: number) =>
  String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  );

const hasAvifFileSignature = (bytes: Uint8Array) => {
  if (bytes.length < 16 || readFourCharacterCode(bytes, 4) !== 'ftyp') {
    return false;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let boxSize = view.getUint32(0);
  let majorBrandOffset = 8;

  if (boxSize === 1) {
    if (bytes.length < 24 || view.getUint32(8) !== 0) {
      return false;
    }

    boxSize = view.getUint32(12);
    majorBrandOffset = 16;
  }

  const compatibleBrandsOffset = majorBrandOffset + 8;

  if (
    boxSize < compatibleBrandsOffset ||
    boxSize > bytes.length ||
    (boxSize - compatibleBrandsOffset) % 4 !== 0
  ) {
    return false;
  }

  if (avifBrands.has(readFourCharacterCode(bytes, majorBrandOffset))) {
    return true;
  }

  for (
    let offset = compatibleBrandsOffset;
    offset + 4 <= boxSize;
    offset += 4
  ) {
    if (avifBrands.has(readFourCharacterCode(bytes, offset))) {
      return true;
    }
  }

  return false;
};

const hasMatchingFileSignature = async (file: File) => {
  const bytesToRead =
    file.type.toLowerCase() === 'image/avif' ? IMAGE_SIGNATURE_READ_BYTES : 12;
  const bytes = new Uint8Array(await file.slice(0, bytesToRead).arrayBuffer());

  switch (file.type.toLowerCase()) {
    case 'image/jpeg':
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'image/png':
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    case 'image/webp':
      return (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    case 'image/avif':
      return hasAvifFileSignature(bytes);
    default:
      return false;
  }
};

const readImageDimensions: ReadImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('The selected image took too long to decode.'));
    }, IMAGE_VALIDATION_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      cleanup();
      resolve(dimensions);
    };

    image.onerror = () => {
      cleanup();
      reject(new Error('The browser could not decode the selected image.'));
    };

    image.src = objectUrl;
  });

export const validateImageUpload = async (
  file: File,
  getDimensions: ReadImageDimensions = readImageDimensions,
) => {
  const constraintError = getImageUploadConstraintError(file);

  if (constraintError) return constraintError;

  try {
    if (!(await hasMatchingFileSignature(file))) {
      return 'The file contents do not match its image format.';
    }

    const { width, height } = await getDimensions(file);

    if (width <= 0 || height <= 0) {
      return 'Choose a valid JPEG, PNG, WebP, or AVIF image.';
    }

    if (
      width > IMAGE_UPLOAD_MAX_DIMENSION ||
      height > IMAGE_UPLOAD_MAX_DIMENSION
    ) {
      return 'Choose an image no larger than 4096 × 4096 pixels.';
    }
  } catch {
    return 'Choose a valid JPEG, PNG, WebP, or AVIF image.';
  }

  return null;
};

export const imageUploadFileSchema = z
  .instanceof(File)
  .superRefine((file, context) => {
    const error = getImageUploadConstraintError(file);

    if (error) {
      context.addIssue({
        code: 'custom',
        message: error,
      });
    }
  });
