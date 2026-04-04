import { fetchFeedPosts } from "../../services/api.js";
import { clearAuthData, getAccessToken, getCurrentUser } from "../../services/storage.js";

function formatDate(dateString) {
	if (!dateString) {
		return "Unknown date";
	}

	const date = new Date(dateString);
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function truncateText(text, maxLength = 150) {
	const value = text || "";

	if (value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength)}...`;
}

function getMediaUrl(media) {
	if (!media) {
		return "";
	}

	if (typeof media === "string") {
		return media;
	}

	if (typeof media === "object" && media.url) {
		return media.url;
	}

	return "";
}

function renderPostCard(post) {
	const mediaUrl = getMediaUrl(post.media);

	return `
		<article class="post-card">
			<div class="post-header">
				<p class="post-author">${post.author?.name || "Unknown"}</p>
				<p class="post-date">${formatDate(post.created)}</p>
			</div>
			<h2 class="post-title">${post.title || "Untitled post"}</h2>
			<p class="post-body">${truncateText(post.body)}</p>
			${mediaUrl ? `<img class="post-media" src="${mediaUrl}" alt="Post media" loading="lazy" />` : ""}
			<div class="post-meta">
				<span>${post._count?.comments || 0} comments</span>
				<span>${post._count?.reactions || 0} reactions</span>
			</div>
		</article>
	`;
}

export function renderFeedPage(rootElement) {
	if (!rootElement) {
		return;
	}

	const accessToken = getAccessToken();

	if (!accessToken) {
		window.location.hash = "#login";
		return;
	}

	const currentUser = getCurrentUser();

	rootElement.innerHTML = `
		<main class="feed-page">
			<header class="feed-topbar">
				<div>
					<h1 class="feed-title">Feed</h1>
					<p class="feed-subtitle">Logged in as ${currentUser.name || "User"}</p>
				</div>
				<button class="logout-button" id="logout-button" type="button">Log Out</button>
			</header>

			<p class="feed-message" id="feed-message" aria-live="polite"></p>
			<section class="feed-grid" id="feed-grid"></section>
			<button class="load-more-button" id="load-more-button" type="button">Load More</button>
		</main>
	`;

	const feedGrid = rootElement.querySelector("#feed-grid");
	const feedMessage = rootElement.querySelector("#feed-message");
	const loadMoreButton = rootElement.querySelector("#load-more-button");
	const logoutButton = rootElement.querySelector("#logout-button");

	if (!feedGrid || !feedMessage || !loadMoreButton || !logoutButton) {
		return;
	}

	let currentPage = 1;
	let isLastPage = false;
	let isLoading = false;

	logoutButton.addEventListener("click", () => {
		clearAuthData();
		window.location.hash = "#login";
	});

	async function loadPosts() {
		if (isLoading || isLastPage) {
			return;
		}

		isLoading = true;
		feedMessage.textContent = "Loading posts...";
		loadMoreButton.disabled = true;

		try {
			const result = await fetchFeedPosts({
				accessToken,
				page: currentPage,
				limit: 12,
			});

			if (result.posts.length === 0 && currentPage === 1) {
				feedGrid.innerHTML = "";
				feedMessage.textContent = "No posts found yet.";
				loadMoreButton.style.display = "none";
				isLastPage = true;
				return;
			}

			feedGrid.insertAdjacentHTML(
				"beforeend",
				result.posts.map((post) => renderPostCard(post)).join(""),
			);

			feedMessage.textContent = "";
			isLastPage = Boolean(result.meta?.isLastPage);

			if (isLastPage) {
				loadMoreButton.style.display = "none";
			} else {
				currentPage += 1;
				loadMoreButton.disabled = false;
			}
		} catch (error) {
			feedMessage.textContent = error.message || "Could not load feed.";

			if ((error.message || "").toLowerCase().includes("unauthorized")) {
				clearAuthData();
				window.location.hash = "#login";
				return;
			}

			loadMoreButton.disabled = false;
		} finally {
			isLoading = false;
		}
	}

	loadMoreButton.addEventListener("click", loadPosts);
	loadPosts();
}
