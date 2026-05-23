import { describe, expect, it } from 'vitest';
import { assertImageSize, assertSupportedMediaType, validateImageUrl } from '../../src/utils/validation';

describe('validateImageUrl', () => {
  it('accepts supported http image URLs', () => {
    expect(validateImageUrl('https://example.com/diagram.png').toString()).toBe(
      'https://example.com/diagram.png'
    );
  });

  it('rejects unsupported protocols', () => {
    expect(() => validateImageUrl('file:///tmp/diagram.png')).toThrow('Unsupported protocol');
  });

  it('rejects unsupported extensions', () => {
    expect(() => validateImageUrl('https://example.com/diagram.webp')).toThrow(
      'Unsupported image format'
    );
  });
});

describe('image guards', () => {
  it('accepts supported media types', () => {
    expect(() => assertSupportedMediaType('image/png; charset=utf-8')).not.toThrow();
  });

  it('rejects unsupported media types', () => {
    expect(() => assertSupportedMediaType('image/webp')).toThrow('Unsupported media type');
  });

  it('rejects files over 10MB', () => {
    expect(() => assertImageSize(10 * 1024 * 1024 + 1)).toThrow('Image too large');
  });
});
