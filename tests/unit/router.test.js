import { describe, expect, it, vi } from 'vitest';
import {
  canAccessRoute,
  createRoutes,
  getMatchingRoute,
  getPostIdFromHash,
} from '../../src/router.js';

function buildHandlers() {
  return {
    renderLoginPage: vi.fn(),
    renderRegisterPage: vi.fn(),
    renderFeedPage: vi.fn(),
    renderPostDetailPage: vi.fn(),
  };
}

describe('getPostIdFromHash', () => {
  it('extracts post id from hash query', () => {
    expect(getPostIdFromHash('#post?id=abc-123')).toBe('abc-123');
  });

  it('returns empty string for non-post hash', () => {
    expect(getPostIdFromHash('#feed')).toBe('');
  });
});

describe('createRoutes + getMatchingRoute', () => {
  it('matches register route', () => {
    const routes = createRoutes(buildHandlers());
    const route = getMatchingRoute('#register', routes);

    expect(route).toBeDefined();
    expect(route.requiresAuth).toBe(false);
  });

  it('matches protected post route', () => {
    const routes = createRoutes(buildHandlers());
    const route = getMatchingRoute('#post?id=post-1', routes);

    expect(route).toBeDefined();
    expect(route.requiresAuth).toBe(true);
  });

  it('falls back to default route for unknown hash', () => {
    const handlers = buildHandlers();
    const routes = createRoutes(handlers);
    const route = getMatchingRoute('#does-not-exist', routes);

    expect(route).toBeDefined();
    route.render('app');
    expect(handlers.renderLoginPage).toHaveBeenCalledWith('app');
  });
});

describe('canAccessRoute', () => {
  it('allows public route without token', () => {
    expect(canAccessRoute({ requiresAuth: false }, '')).toBe(true);
  });

  it('blocks protected route without token', () => {
    expect(canAccessRoute({ requiresAuth: true }, '')).toBe(false);
  });

  it('allows protected route with token', () => {
    expect(canAccessRoute({ requiresAuth: true }, 'token-123')).toBe(true);
  });
});
