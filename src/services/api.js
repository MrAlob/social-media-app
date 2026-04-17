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

export async function createPost({ accessToken, postData }) {
  const { apiBaseUrl, apiKey } = getApiConfig({ requireApiKey: true });

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  const response = await fetch(`${apiBaseUrl}/social/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    const error = new Error(apiMessage || 'Failed to create post');
    error.status = response.status;
    throw error;
  }

  return responseBody?.data || null;
}

export async function updatePost({ accessToken, postId, postData }) {
  const { apiBaseUrl, apiKey } = getApiConfig({ requireApiKey: true });

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  if (!postId) {
    throw new Error('Post id is required');
  }

  const response = await fetch(`${apiBaseUrl}/social/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    const error = new Error(apiMessage || 'Failed to update post');
    error.status = response.status;
    throw error;
  }

  return responseBody?.data || null;
}

export async function deletePost({ accessToken, postId }) {
  const { apiBaseUrl, apiKey } = getApiConfig({ requireApiKey: true });

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  if (!postId) {
    throw new Error('Post id is required');
  }

  const response = await fetch(`${apiBaseUrl}/social/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
    },
  });

  if (response.status === 204) {
    return true;
  }

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    const error = new Error(apiMessage || 'Failed to delete post');
    error.status = response.status;
    throw error;
  }

  return true;
}

export async function fetchProfileByName({ accessToken, profileName }) {
  const { apiBaseUrl, apiKey } = getApiConfig({ requireApiKey: true });

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  if (!profileName) {
    throw new Error('Profile name is required');
  }

  const response = await fetch(`${apiBaseUrl}/social/profiles/${encodeURIComponent(profileName)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
    },
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    const error = new Error(apiMessage || 'Failed to load profile');
    error.status = response.status;
    throw error;
  }

  return responseBody?.data || null;
}

export async function fetchProfilePosts({ accessToken, profileName, page = 1, limit = 12 }) {
  const { apiBaseUrl, apiKey } = getApiConfig({ requireApiKey: true });

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  if (!profileName) {
    throw new Error('Profile name is required');
  }

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    _author: 'true',
    _comments: 'true',
    _reactions: 'true',
  });

  const response = await fetch(
    `${apiBaseUrl}/social/profiles/${encodeURIComponent(profileName)}/posts?${query.toString()}`,
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
    const error = new Error(apiMessage || 'Failed to load profile posts');
    error.status = response.status;
    throw error;
  }

  return {
    posts: responseBody?.data || [],
    meta: responseBody?.meta || {},
  };
}
