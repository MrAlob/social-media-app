const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_NOROFF_API_KEY;

export async function fetchFeedPosts({ accessToken, page = 1, limit = 12 }) {
	if (!API_BASE_URL) {
		throw new Error("Missing VITE_API_BASE_URL in .env");
	}

	if (!API_KEY) {
		throw new Error("Missing VITE_NOROFF_API_KEY in .env");
	}

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
			"X-Noroff-API-Key": API_KEY,
		},
	});

	const responseBody = await response.json().catch(() => ({}));

	if (!response.ok) {
		const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
		const error = new Error(apiMessage || "Failed to load feed");
		error.status = response.status;
		throw error;
	}

	return {
		posts: responseBody?.data || [],
		meta: responseBody?.meta || {},
	};
}
