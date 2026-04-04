const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchFeedPosts({ accessToken, page = 1, limit = 12 }) {
	const query = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		_author: "true",
		_comments: "true",
		_reactions: "true",
	});

	const response = await fetch(`${API_BASE_URL}/social/posts?${query.toString()}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"X-Noroff-API-Key": import.meta.env.VITE_NOROFF_API_KEY,
		},
	});

	const responseBody = await response.json().catch(() => ({}));

	if (!response.ok) {
		const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
		throw new Error(apiMessage || "Failed to load feed");
	}

	return {
		posts: responseBody?.data || [],
		meta: responseBody?.meta || {},
	};
}
