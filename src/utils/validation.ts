import { AppError } from './errors.js';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.svg'];
const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/svg+xml'];
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function validateImageUrl(input: string): URL {
  const value = input.trim();
  if (!value) {
    throw new AppError('Empty URL', 'Enter an image URL before adding it to the queue.');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AppError('Malformed URL', 'Enter a valid URL that starts with http:// or https://.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError('Unsupported protocol', 'Only http:// and https:// image URLs are supported.');
  }

  const pathname = url.pathname.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.some((extension) => pathname.endsWith(extension))) {
    throw new AppError(
      'Unsupported image format',
      'Use a JPG, PNG, BMP, or SVG image URL for this version.'
    );
  }

  return url;
}

export function assertSupportedMediaType(mediaType: string): void {
  const normalized = mediaType.split(';')[0].trim().toLowerCase();
  if (!SUPPORTED_MEDIA_TYPES.includes(normalized)) {
    throw new AppError(
      `Unsupported media type: ${mediaType}`,
      'The remote file is not a supported image type. Use JPG, PNG, BMP, or SVG.'
    );
  }
}

export function assertImageSize(sizeBytes: number): void {
  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError(
      `Image too large: ${sizeBytes}`,
      'The image is larger than 10MB. Use a smaller image and try again.'
    );
  }
}
