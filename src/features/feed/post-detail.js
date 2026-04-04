import { fetchPostById } from "../../services/api.js";
import { clearAuthData, getAccessToken } from "../../services/storage.js";

function escapeHtml(value) {
	return String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function formatDateTime(dateString) {
	if (!dateString) {
		return "Unknown date";
	}

	const date = new Date(dateString);

	return date.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getMediaUrl(media) {
	const rawUrl = typeof media === "string" ? media : media?.url;

	if (!rawUrl) {
		return "";
	}

	try {
		const parsed = new URL(rawUrl);

		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return "";
		}

		return parsed.toString();
	} catch {
		return "";
	}
}

function renderComments(comments = []) {
	if (!Array.isArray(comments) || comments.length === 0) {
		return '<p class="detail-empty">No comments yet.</p>';
	}

	return `
		<ul class="detail-comments-list">
			${comments
				.map((comment) => {
					const owner = escapeHtml(comment.owner || "Unknown");
					const body = escapeHtml(comment.body || "");
					const created = escapeHtml(formatDateTime(comment.created));

					return `
						<li class="detail-comment-item">
							<p class="detail-comment-head">${owner} • ${created}</p>
							<p class="detail-comment-body">${body}</p>
						</li>
					`;
				})
				.join("")}
		</ul>
	`;
}

function renderReactions(reactions = []) {
	if (!Array.isArray(reactions) || reactions.length === 0) {
		return '<p class="detail-empty">No reactions yet.</p>';
	}

	return `
		<ul class="detail-reaction-list">
			${reactions
				.map((reaction) => {
					const symbol = escapeHtml(reaction.symbol || "?");
					const count = Number(reaction.count || 0);
					return `<li class="detail-reaction-item">${symbol} ${count}</li>`;
				})
				.join("")}
		</ul>
	`;
}

function renderPostDetail(post) {
	const title = escapeHtml(post?.title || "Untitled post");
	const body = escapeHtml(post?.body || "");
	const authorName = escapeHtml(post?.author?.name || "Unknown");
	const authorEmail = escapeHtml(post?.author?.email || "No email");
	const created = escapeHtml(formatDateTime(post?.created));
	const mediaUrl = getMediaUrl(post?.media);
	const tags = Array.isArray(post?.tags) ? post.tags : [];
	const safeTags = tags.map((tag) => escapeHtml(tag)).filter(Boolean);
	const commentsCount = Number(post?._count?.comments || post?.comments?.length || 0);
	const reactionsCount = Number(post?._count?.reactions || 0);

	return `
		<article class="post-detail-card">
			<header class="post-detail-header">
				<p class="post-detail-author">${authorName}</p>
				<p class="post-detail-email">${authorEmail}</p>
				<p class="post-detail-date">${created}</p>
			</header>

			<h1 class="post-detail-title">${title}</h1>
			<p class="post-detail-body">${body}</p>

			${mediaUrl ? `<img class="post-detail-media" src="${mediaUrl}" alt="Post media" loading="lazy" />` : ""}

			${
				safeTags.length > 0
					? `<ul class="post-detail-tags">${safeTags.map((tag) => `<li>#${tag}</li>`).join("")}</ul>`
					: ""
			}

			<div class="post-detail-counts">
				<span>${commentsCount} comments</span>
				<span>${reactionsCount} reactions</span>
			</div>

			<section class="post-detail-section">
				<h2>Reactions</h2>
				${renderReactions(post?.reactions)}
			</section>

			<section class="post-detail-section">
				<h2>Comments</h2>
				${renderComments(post?.comments)}
			</section>
		</article>
	`;
}

export function renderPostDetailPage(rootElement, postId) {
	if (!rootElement) {
		return;
	}

	const accessToken = getAccessToken();

	if (!accessToken) {
		window.location.hash = "#login";
		return;
	}

	rootElement.innerHTML = `
		<main class="feed-page">
			<header class="detail-topbar">
				<button class="back-button" id="back-to-feed" type="button">Back to feed</button>
			</header>
			<p class="feed-message" id="post-detail-message" aria-live="polite">Loading post...</p>
			<section id="post-detail-content"></section>
		</main>
	`;

	const backButton = rootElement.querySelector("#back-to-feed");
	const messageElement = rootElement.querySelector("#post-detail-message");
	const contentElement = rootElement.querySelector("#post-detail-content");

	if (!backButton || !messageElement || !contentElement) {
		return;
	}

	backButton.addEventListener("click", () => {
		window.location.hash = "#feed";
	});

	if (!postId) {
		messageElement.textContent = "Missing post id in URL.";
		return;
	}

	fetchPostById({ accessToken, postId })
		.then((post) => {
			if (!post) {
				messageElement.textContent = "Post not found.";
				return;
			}

			messageElement.textContent = "";
			contentElement.innerHTML = renderPostDetail(post);
		})
		.catch((error) => {
			if (error.status === 401) {
				clearAuthData();
				window.location.hash = "#login";
				return;
			}

			if (error.status === 404) {
				messageElement.textContent = "Post not found.";
				return;
			}

			messageElement.textContent = error.message || "Could not load post.";
		});
}
