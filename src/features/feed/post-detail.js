import { deletePost, fetchPostById } from '../../services/api.js';
import { clearAuthData, getAccessToken, getCurrentUser } from '../../services/storage.js';
import { escapeHtml, formatDateTime, getMediaUrl } from '../../utils/format.js';
import { showConfirmDialog } from '../../ui/confirm.js';

function renderComments(comments = []) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return '<p class="detail-empty">No comments yet.</p>';
  }

  return `
    <ul class="detail-comments-list">
      ${comments
        .map((comment) => {
          const ownerName = typeof comment.owner === 'string' ? comment.owner : (comment.owner?.name ?? 'Unknown');
          const owner = escapeHtml(ownerName);
          const body = escapeHtml(comment.body || '');
          const created = escapeHtml(formatDateTime(comment.created));

          return `
            <li class="detail-comment-item">
              <p class="detail-comment-head">${owner} • ${created}</p>
              <p class="detail-comment-body">${body}</p>
            </li>
          `;
        })
        .join('')}
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
          const symbol = escapeHtml(reaction.symbol || '?');
          const count = Number(reaction.count || 0);
          return `<li class="detail-reaction-item">${symbol} ${count}</li>`;
        })
        .join('')}
    </ul>
  `;
}

function renderPostDetail(post, currentUser) {
  const title = escapeHtml(post?.title || 'Untitled post');
  const body = escapeHtml(post?.body || '');
  const rawTitle = String(post?.title || 'Untitled post');
  const authorRawName = String(post?.author?.name || 'Unknown');
  const authorName = escapeHtml(authorRawName);
  const authorEmail = escapeHtml(post?.author?.email || 'No email');
  const created = escapeHtml(formatDateTime(post?.created));
  const mediaUrl = getMediaUrl(post?.media);
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  const safeTags = tags.map((tag) => escapeHtml(tag)).filter(Boolean);
  const commentsCount = Number(post?._count?.comments || post?.comments?.length || 0);
  const reactionsCount = Number(post?._count?.reactions || 0);
  const isOwner = String(post?.author?.name || '') === String(currentUser?.name || '');
  const postId = escapeHtml(post?.id || '');

  return `
    <article class="post-detail-card">
      <header class="post-detail-header">
        <button class="post-author-button" type="button" data-profile-name="${authorName}">${authorName}</button>
        <p class="post-detail-email">${authorEmail}</p>
        <p class="post-detail-date">${created}</p>
      </header>

      <h1 class="post-detail-title">${title}</h1>
      ${
        isOwner
          ? `<div class="post-actions">
              <button class="post-open-button" type="button" data-edit-post-id="${postId}">Edit post</button>
              <button class="post-delete-button" type="button" data-delete-post-id="${postId}" data-post-title="${escapeHtml(rawTitle)}">Delete</button>
            </div>`
          : ''
      }
      <p class="post-detail-body">${body}</p>

      ${mediaUrl ? `<img class="post-detail-media" src="${mediaUrl}" alt="Post media" loading="lazy" />` : ''}

      ${
        safeTags.length > 0
          ? `<ul class="post-detail-tags">${safeTags.map((tag) => `<li>#${tag}</li>`).join('')}</ul>`
          : ''
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

export async function renderPostDetailPage(rootElement, postId) {
  if (!rootElement) return;

  const accessToken = getAccessToken();
  const currentUser = getCurrentUser();

  if (!accessToken) {
    window.location.hash = '#login';
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

  const backButton = rootElement.querySelector('#back-to-feed');
  const messageElement = rootElement.querySelector('#post-detail-message');
  const contentElement = rootElement.querySelector('#post-detail-content');

  backButton.addEventListener('click', () => {
    window.location.hash = '#feed';
  });

  if (!postId) {
    messageElement.textContent = 'Missing post id in URL.';
    return;
  }

  let post;
  try {
    post = await fetchPostById({ accessToken, postId });
  } catch (error) {
    if (error.status === 401) {
      clearAuthData();
      window.location.hash = '#login';
      return;
    }
    if (error.status === 404) {
      messageElement.textContent = 'Post not found.';
      return;
    }
    messageElement.textContent = error.message || 'Could not load post.';
    return;
  }

  if (!post) {
    messageElement.textContent = 'Post not found.';
    return;
  }

  messageElement.textContent = '';
  messageElement.classList.remove('is-error', 'is-success');
  contentElement.innerHTML = renderPostDetail(post, currentUser);

  const editButton = contentElement.querySelector('[data-edit-post-id]');
  const deleteButton = contentElement.querySelector('[data-delete-post-id]');
  const profileButton = contentElement.querySelector('[data-profile-name]');

  profileButton?.addEventListener('click', () => {
    const profileName = profileButton.getAttribute('data-profile-name');
    if (profileName) window.location.hash = `#profile?name=${encodeURIComponent(profileName)}`;
  });

  editButton?.addEventListener('click', () => {
    window.location.hash = `#edit?id=${encodeURIComponent(postId)}`;
  });

  deleteButton?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'Delete Post',
      message: `Are you sure you want to delete "${post?.title || 'this post'}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    });

    if (!confirmed) return;

    deleteButton.disabled = true;
    deleteButton.textContent = 'Deleting...';

    try {
      await deletePost({ accessToken, postId });
      messageElement.textContent = 'Post deleted successfully. Returning to feed...';
      messageElement.classList.remove('is-error');
      messageElement.classList.add('is-success');
      setTimeout(() => {
        window.location.hash = '#feed';
      }, 700);
    } catch (error) {
      if (error.status === 401) {
        clearAuthData();
        window.location.hash = '#login';
        return;
      }

      const messageByStatus = { 403: 'You can only delete your own post.', 404: 'Post not found.' };
      messageElement.textContent = messageByStatus[error.status] || error.message || 'Could not delete post.';
      messageElement.classList.remove('is-success');
      messageElement.classList.add('is-error');
      deleteButton.disabled = false;
      deleteButton.textContent = 'Delete';
    }
  });
}
