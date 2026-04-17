import { describe, expect, it } from 'vitest';
import { getEditPostIdFromHash, validatePostOwnership } from '../../src/features/feed/post-edit.js';

describe('getEditPostIdFromHash', () => {
  it('extracts post id from edit hash query', () => {
    expect(getEditPostIdFromHash('#edit?id=post-1')).toBe('post-1');
  });

  it('returns empty string when hash is not edit route', () => {
    expect(getEditPostIdFromHash('#feed')).toBe('');
  });
});

describe('validatePostOwnership', () => {
  it('returns true when current user owns post', () => {
    const post = { author: { name: 'alice' } };
    const currentUser = { name: 'alice' };

    expect(validatePostOwnership(post, currentUser)).toBe(true);
  });

  it('returns false when current user does not own post', () => {
    const post = { author: { name: 'alice' } };
    const currentUser = { name: 'bob' };

    expect(validatePostOwnership(post, currentUser)).toBe(false);
  });
});
