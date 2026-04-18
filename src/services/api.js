import { getApiConfig } from '../config/env.js';

const POST_PARAMS = { _author: 'true', _comments: 'true', _reactions: 'true' };

async function apiFetch(url, accessToken, options = {}) {
  const { apiKey } = getApiConfig({ requireApiKey: true });

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.errors?.[0]?.message || body?.message;
    const error = new Error(message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return body;
}

export async function fetchFeedPosts({ accessToken, page = 1, limit = 12 }) {
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...POST_PARAMS });
  const body = await apiFetch(`${apiBaseUrl}/social/posts?${query}`, accessToken);
  return { posts: body?.data || [], meta: body?.meta || {} };
}

export async function searchPosts({ accessToken, queryText, page = 1, limit = 12 }) {
  const searchQuery = String(queryText || '').trim();

  if (!searchQuery) return { posts: [], meta: { isLastPage: true } };

  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const query = new URLSearchParams({ q: searchQuery, page: String(page), limit: String(limit), ...POST_PARAMS });
  const body = await apiFetch(`${apiBaseUrl}/social/posts/search?${query}`, accessToken);
  return { posts: body?.data || [], meta: body?.meta || {} };
}

export async function fetchPostById({ accessToken, postId }) {
  if (!postId) throw new Error('Post id is required');
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const query = new URLSearchParams(POST_PARAMS);
  const body = await apiFetch(`${apiBaseUrl}/social/posts/${encodeURIComponent(postId)}?${query}`, accessToken);
  return body?.data || null;
}

export async function createPost({ accessToken, postData }) {
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const body = await apiFetch(`${apiBaseUrl}/social/posts`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  return body?.data || null;
}

export async function updatePost({ accessToken, postId, postData }) {
  if (!postId) throw new Error('Post id is required');
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const body = await apiFetch(`${apiBaseUrl}/social/posts/${encodeURIComponent(postId)}`, accessToken, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  });
  return body?.data || null;
}

export async function deletePost({ accessToken, postId }) {
  if (!postId) throw new Error('Post id is required');
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  await apiFetch(`${apiBaseUrl}/social/posts/${encodeURIComponent(postId)}`, accessToken, { method: 'DELETE' });
  return true;
}

export async function fetchProfileByName({ accessToken, profileName }) {
  if (!profileName) throw new Error('Profile name is required');
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const query = new URLSearchParams({ _followers: 'true', _following: 'true' });
  const body = await apiFetch(`${apiBaseUrl}/social/profiles/${encodeURIComponent(profileName)}?${query}`, accessToken);
  return body?.data || null;
}

export async function fetchProfilePosts({ accessToken, profileName, page = 1, limit = 12 }) {
  if (!profileName) throw new Error('Profile name is required');
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...POST_PARAMS });
  const body = await apiFetch(`${apiBaseUrl}/social/profiles/${encodeURIComponent(profileName)}/posts?${query}`, accessToken);
  return { posts: body?.data || [], meta: body?.meta || {} };
}

export async function followProfile({ accessToken, profileName }) {
  if (!profileName) throw new Error('Profile name is required');
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const body = await apiFetch(`${apiBaseUrl}/social/profiles/${encodeURIComponent(profileName)}/follow`, accessToken, { method: 'PUT' });
  return body?.data || null;
}

export async function unfollowProfile({ accessToken, profileName }) {
  if (!profileName) throw new Error('Profile name is required');
  const { apiBaseUrl } = getApiConfig({ requireApiKey: true });
  const body = await apiFetch(`${apiBaseUrl}/social/profiles/${encodeURIComponent(profileName)}/unfollow`, accessToken, { method: 'PUT' });
  return body?.data || null;
}
