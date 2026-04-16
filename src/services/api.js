import { getApiConfig } from '../config/env.js';

export async function fetchFeedPosts({ accessToken, page = 1, limit = 12 }) {
  const { apiBaseUrl, apiKey } = getApiConfig({ requireApiKey: true });

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    _author: 'true',
    _comments: 'true',
    _reactions: 'true',
  });

  const response = await fetch(`${apiBaseUrl}/social/posts?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
    },
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    const error = new Error(apiMessage || 'Failed to load feed');
    error.status = response.status;
    throw error;
  }

  return {
    posts: responseBody?.data || [],
    meta: responseBody?.meta || {},
  };
}

export async function fetchPostById({ accessToken, postId }) {
  const { apiBaseUrl, apiKey } = getApiConfig({ requireApiKey: true });

  if (!postId) {
    throw new Error('Post id is required');
  }

  const query = new URLSearchParams({
    _author: 'true',
    _comments: 'true',
    _reactions: 'true',
  });

  const response = await fetch(
    `${apiBaseUrl}/social/posts/${encodeURIComponent(postId)}?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Noroff-API-Key': apiKey,
      },
    },
  );

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    const error = new Error(apiMessage || 'Failed to load post');
    error.status = response.status;
    throw error;
  }

  return responseBody?.data || null;
}
