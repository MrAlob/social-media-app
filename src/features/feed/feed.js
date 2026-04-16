import { fetchFeedPosts } from '../../services/api.js';
import { clearAuthData, getAccessToken, getCurrentUser } from '../../services/storage.js';
import { escapeHtml, formatDate, getMediaUrl, truncateText } from '../../utils/format.js';

function renderPostCard(post) {
  const mediaUrl = getMediaUrl(post.media);
  const postId = escapeHtml(post.id);
  const authorName = escapeHtml(post.author?.name || 'Unknown');
  const postDate = escapeHtml(formatDate(post.created));
  const postTitle = escapeHtml(post.title || 'Untitled post');
  const postBody = escapeHtml(truncateText(post.body));
  const commentsCount = Number(post._count?.comments || 0);
  const reactionsCount = Number(post._count?.reactions || 0);

  return `
		<article class="post-card" data-post-id="${postId}">
			<div class="post-header">
				<p class="post-author">${authorName}</p>
				<p class="post-date">${postDate}</p>
			</div>
			<h2 class="post-title">${postTitle}</h2>
			<p class="post-body">${postBody}</p>
			${mediaUrl ? `<img class="post-media" src="${mediaUrl}" alt="Post media" loading="lazy" width="640" height="360" />` : ''}
			<div class="post-meta">
				<span>${commentsCount} comments</span>
				<span>${reactionsCount} reactions</span>
			</div>
			<button class="post-open-button" type="button" data-post-id="${postId}">Open post</button>
		</article>
	`;
}

export function renderFeedPage(rootElement) {
  if (!rootElement) {
    return;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    window.location.hash = '#login';
    return;
  }

  const currentUser = getCurrentUser();
  const safeUserName = escapeHtml(currentUser.name || 'User');

  rootElement.innerHTML = `
		<main class="feed-page">
			<header class="feed-topbar">
				<div>
					<h1 class="feed-title">Feed</h1>
					<p class="feed-subtitle">Logged in as ${safeUserName}</p>
				</div>
        <div class="feed-actions">
          <button class="create-post-button" id="create-post-button" type="button">Create Post</button>
          <button class="logout-button" id="logout-button" type="button">Log Out</button>
        </div>
			</header>

			<p class="feed-message" id="feed-message" aria-live="polite"></p>
			<section class="feed-grid" id="feed-grid"></section>
			<button class="load-more-button" id="load-more-button" type="button">Load More</button>
		</main>
	`;

  const feedGrid = rootElement.querySelector('#feed-grid');
  const feedMessage = rootElement.querySelector('#feed-message');
  const loadMoreButton = rootElement.querySelector('#load-more-button');
  const logoutButton = rootElement.querySelector('#logout-button');
  const createPostButton = rootElement.querySelector('#create-post-button');

  if (!feedGrid || !feedMessage || !loadMoreButton || !logoutButton || !createPostButton) {
    return;
  }

  createPostButton.addEventListener('click', () => {
    window.location.hash = '#create';
  });

  feedGrid.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const trigger = target.closest('[data-post-id]');

    if (!trigger) {
      return;
    }

    const postId = trigger.getAttribute('data-post-id');

    if (!postId) {
      return;
    }

    window.location.hash = `#post?id=${encodeURIComponent(postId)}`;
  });

  let currentPage = 1;
  let isLastPage = false;
  let isLoading = false;

  logoutButton.addEventListener('click', () => {
    clearAuthData();
    window.location.hash = '#login';
  });

  async function loadPosts() {
    if (isLoading || isLastPage) {
      return;
    }

    isLoading = true;
    feedMessage.textContent = 'Loading posts...';
    loadMoreButton.disabled = true;

    try {
      const result = await fetchFeedPosts({
        accessToken,
        page: currentPage,
        limit: 12,
      });

      if (result.posts.length === 0 && currentPage === 1) {
        feedGrid.innerHTML = '';
        feedMessage.textContent = 'No posts found yet.';
        loadMoreButton.style.display = 'none';
        isLastPage = true;
        return;
      }

      feedGrid.insertAdjacentHTML(
        'beforeend',
        result.posts.map((post) => renderPostCard(post)).join(''),
      );

      feedMessage.textContent = '';
      isLastPage = Boolean(result.meta?.isLastPage);

      if (isLastPage) {
        loadMoreButton.style.display = 'none';
      } else {
        currentPage += 1;
        loadMoreButton.disabled = false;
      }
    } catch (error) {
      feedMessage.textContent = error.message || 'Could not load feed.';

      if (error.status === 401) {
        clearAuthData();
        window.location.hash = '#login';
        return;
      }

      loadMoreButton.disabled = false;
    } finally {
      isLoading = false;
    }
  }

  loadMoreButton.addEventListener('click', loadPosts);
  loadPosts();
}
