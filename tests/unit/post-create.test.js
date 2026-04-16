import { describe, expect, it } from 'vitest';
import { validateMediaUrl, validatePostForm } from '../../src/features/feed/post-create.js';

describe('validateMediaUrl', () => {
  it('accepts empty value because media is optional', () => {
    expect(validateMediaUrl('')).toBe(true);
  });

  it('accepts valid image URLs', () => {
    expect(validateMediaUrl('https://example.com/photo.jpg')).toBe(true);
    expect(validateMediaUrl('https://example.com/path/image.webp')).toBe(true);
  });

  it('rejects invalid or non-image URLs', () => {
    expect(validateMediaUrl('not-a-url')).toBe(false);
    expect(validateMediaUrl('https://example.com/file.pdf')).toBe(false);
  });
});

describe('validatePostForm', () => {
  it('accepts valid post form input', () => {
    const result = validatePostForm({
      title: 'My first post',
      body: 'Learning JavaScript modules',
      tags: 'learning,javascript',
      media: 'https://example.com/image.png',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.data).toEqual({
      title: 'My first post',
      body: 'Learning JavaScript modules',
      tags: ['learning', 'javascript'],
      media: {
        url: 'https://example.com/image.png',
        alt: 'My first post',
      },
    });
  });

  it('requires title', () => {
    const result = validatePostForm({ title: '', body: '', tags: '', media: '' });

    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBe('Title is required');
  });

  it('rejects tags with spaces', () => {
    const result = validatePostForm({
      title: 'Valid title',
      tags: 'good,not valid',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.tags).toBe('Tags cannot contain spaces. Use comma-separated tags.');
  });

  it('rejects non-image media URL', () => {
    const result = validatePostForm({
      title: 'Valid title',
      media: 'https://example.com/file.txt',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.media).toBe('Use a valid image URL ending in jpg, jpeg, png, gif, or webp');
  });
});
