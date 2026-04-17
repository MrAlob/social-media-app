import { deletePost, fetchFeedPosts, searchPosts } from '../../services/api.js';
import { clearAuthData, getAccessToken, getCurrentUser } from '../../services/storage.js';
import { escapeHtml, formatDate, getMediaUrl, truncateText } from '../../utils/format.js';
import { debounce } from '../../utils/debounce.js';
import { showConfirmDialog } from '../../ui/confirm.js';

function renderPostCard(post, currentUserName) {
  const mediaUrl = getMediaUrl(post.media);
  const postId = escapeHtml(post.id);
  const authorRawName = String(post.author?.name || 'Unknown');
  const authorName = escapeHtml(authorRawName);
  const postDate = escapeHtml(formatDate(post.created));
  const postTitle = escapeHtml(post.title || 'Untitled post');
  const postBody = escapeHtml(truncateText(post.body));
  const commentsCount = Number(post._count?.comments || 0);
  const reactionsCount = Number(post._count?.reactions || 0);
  const isOwner = String(post.author?.name || '') === String(currentUserName || '');

  return `
		<article class="post-card" data-post-id="${postId}">
			<div class="post-header">
        <button class="post-author-button" type="button" data-profile-name="${authorName}">${authorName}</button>
				<p class="post-date">${postDate}</p>
			</div>
			<h2 class="post-title">${postTitle}</h2>
			<p class="post-body">${postBody}</p>
			${mediaUrl ? `<img class="post-media" src="${mediaUrl}" alt="Post media" loading="lazy" width="640" height="360" />` : ''}
			<div class="post-meta">
				<span>${commentsCount} comments</span>
				<span>${reactionsCount} reactions</span>
			</div>
      <div class="post-actions">
        <button class="post-open-button" type="button" data-post-id="${postId}">Open post</button>
        ${
          isOwner
            ? `<button class="post-open-button" type="button" data-edit-post-id="${postId}">Edit post</button>
               <button class="post-delete-button" type="button" data-delete-post-id="${postId}" data-post-title="${postTitle}">Delete</button>`
            : ''
        }
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

      <section class="feed-search" aria-label="Search posts">
        <input
          id="feed-search-input"
          class="field-input feed-search-input"
          type="search"
          placeholder="Search posts..."
          autocomplete="off"
        />
        <button id="feed-search-clear" class="back-button feed-search-clear" type="button" hidden>Clear</button>
      </section>
      <p class="feed-subtitle" id="feed-search-result"></p>

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
  const searchInput = rootElement.querySelector('#feed-search-input');
  const clearSearchButton = rootElement.querySelector('#feed-search-clear');
  const searchResult = rootElement.querySelector('#feed-search-result');

  if (
    !feedGrid ||
    !feedMessage ||
    !loadMoreButton ||
    !logoutButton ||
    !createPostButton ||
    !searchInput ||
    !clearSearchButton ||
    !searchResult
  ) {
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
    const editTrigger = target.closest('[data-edit-post-id]');
    const deleteTrigger = target.closest('[data-delete-post-id]');
    const profileTrigger = target.closest('[data-profile-name]');

    if (profileTrigger) {
      const profileName = profileTrigger.getAttribute('data-profile-name');

      if (!profileName) {
        return;
      }

      window.location.hash = `#profile?name=${encodeURIComponent(profileName)}`;
      return;
    }

    if (deleteTrigger) {
      const deletePostId = deleteTrigger.getAttribute('data-delete-post-id');
      const postTitle = deleteTrigger.getAttribute('data-post-title') || 'this post';

      if (!deletePostId) {
        return;
      }

      showConfirmDialog({
        title: 'Delete Post',
        message: `Are you sure you want to delete "${postTitle}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true,
      }).then(async (confirmed) => {
        if (!confirmed) {
          return;
        }

        const deleteButton =
          deleteTrigger instanceof HTMLButtonElement
            ? deleteTrigger
            : feedGrid.querySelector(`[data-delete-post-id="${deletePostId}"]`);

        if (deleteButton instanceof HTMLButtonElement) {
          deleteButton.disabled = true;
          deleteButton.textContent = 'Deleting...';
        }

        try {
          await deletePost({ accessToken, postId: deletePostId });

          const card = feedGrid.querySelector(`[data-post-id="${deletePostId}"]`);

          if (card) {
            card.remove();
          }

          feedMessage.textContent = 'Post deleted successfully.';
          feedMessage.classList.remove('is-error');
          feedMessage.classList.add('is-success');
        } catch (error) {
          if (error.status === 401) {
            clearAuthData();
            window.location.hash = '#login';
            return;
          }

          const messageByStatus = {
            403: 'You can only delete your own post.',
            404: 'Post not found.',
          };

          feedMessage.textContent = messageByStatus[error.status] || error.message || 'Could not delete post.';
          feedMessage.classList.remove('is-success');
          feedMessage.classList.add('is-error');

          if (deleteButton instanceof HTMLButtonElement) {
            deleteButton.disabled = false;
            deleteButton.textContent = 'Delete';
          }
        }
      });

      return;
    }

    if (editTrigger) {
      const editPostId = editTrigger.getAttribute('data-edit-post-id');

      if (!editPostId) {
        return;
      }

      window.location.hash = `#edit?id=${encodeURIComponent(editPostId)}`;
      return;
    }

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
  let currentQuery = '';

  function resetFeedState() {
    currentPage = 1;
    isLastPage = false;
    feedGrid.innerHTML = '';
    loadMoreButton.style.display = '';
  }

  logoutButton.addEventListener('click', () => {
    clearAuthData();
    window.location.hash = '#login';
  });

  async function loadPosts() {
    if (isLoading || isLastPage) {
      return;
    }

    isLoading = true;
    const hasSearch = Boolean(currentQuery);
    feedMessage.textContent = hasSearch ? 'Searching posts...' : 'Loading posts...';
    loadMoreButton.disabled = true;

    try {
      const result = hasSearch
        ? await searchPosts({
            accessToken,
            queryText: currentQuery,
            page: currentPage,
            limit: 12,
          })
        : await fetchFeedPosts({
            accessToken,
            page: currentPage,
            limit: 12,
          });

      if (result.posts.length === 0 && currentPage === 1) {
        feedGrid.innerHTML = '';
        feedMessage.textContent = hasSearch
          ? `No results found for "${currentQuery}".`
          : 'No posts found yet.';
        loadMoreButton.style.display = 'none';
        isLastPage = true;
        searchResult.textContent = hasSearch ? 'Found 0 posts' : '';
        return;
      }

      feedGrid.insertAdjacentHTML(
        'beforeend',
        result.posts.map((post) => renderPostCard(post, currentUser.name)).join(''),
      );

      feedMessage.textContent = '';
      feedMessage.classList.remove('is-error', 'is-success');
      isLastPage = Boolean(result.meta?.isLastPage);

      if (hasSearch) {
        const renderedPostCount = feedGrid.querySelectorAll('.post-card').length;
        searchResult.textContent = `Found ${renderedPostCount} post${renderedPostCount === 1 ? '' : 's'}`;
      } else {
        searchResult.textContent = '';
      }

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

  const onSearchInput = debounce(() => {
    const query = String(searchInput.value || '').trim();
    const normalizedQuery = query.toLowerCase();
    const previousQuery = currentQuery.toLowerCase();

    clearSearchButton.hidden = !query;

    if (normalizedQuery === previousQuery) {
      return;
    }

    currentQuery = query;
    resetFeedState();
    loadPosts();
  }, 300);

  searchInput.addEventListener('input', onSearchInput);

  clearSearchButton.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchButton.hidden = true;
    currentQuery = '';
    searchResult.textContent = '';
    resetFeedState();
    loadPosts();
    searchInput.focus();
  });

  loadMoreButton.addEventListener('click', loadPosts);
  loadPosts();
}
