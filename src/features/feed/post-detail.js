import { createComment, createCommentReply, deletePost, fetchPostById, reactToPost } from '../../services/api.js';
import { clearAuthData, getAccessToken, getCurrentUser } from '../../services/storage.js';
import { escapeHtml, formatDateTime, getMediaUrl } from '../../utils/format.js';
import { showConfirmDialog } from '../../ui/confirm.js';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

/**
 * Organises a flat comments array into a tree of top-level comments with nested replies.
 * @param {Array} comments - Flat array of comment objects from the API.
 * @returns {Array} Tree of comment objects, each with a `replies` array.
 */
function buildCommentTree(comments) {
  const map = {};
  const roots = [];
  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  comments.forEach((c) => {
    if (c.replyToId && map[c.replyToId]) {
      map[c.replyToId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

function renderReplyList(replies) {
  if (!replies || replies.length === 0) return '';
  return `
    <ul class="detail-replies-list">
      ${replies
        .map((reply) => {
          const ownerName = typeof reply.owner === 'string' ? reply.owner : (reply.owner?.name ?? 'Unknown');
          const owner = escapeHtml(ownerName);
          const body = escapeHtml(reply.body || '');
          const created = escapeHtml(formatDateTime(reply.created));
          return `
            <li class="detail-reply-item">
              <p class="detail-comment-head">${owner} • ${created}</p>
              <p class="detail-comment-body">${body}</p>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function renderComments(comments = []) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return '<p class="detail-empty">No comments yet.</p>';
  }

  const tree = buildCommentTree(comments);

  return `
    <ul class="detail-comments-list">
      ${tree
        .map((comment) => {
          const ownerName = typeof comment.owner === 'string' ? comment.owner : (comment.owner?.name ?? 'Unknown');
          const owner = escapeHtml(ownerName);
          const body = escapeHtml(comment.body || '');
          const created = escapeHtml(formatDateTime(comment.created));
          const commentId = escapeHtml(String(comment.id || ''));

          return `
            <li class="detail-comment-item">
              <p class="detail-comment-head">${owner} • ${created}</p>
              <p class="detail-comment-body">${body}</p>
              <button class="detail-reply-btn" type="button" data-reply-to="${commentId}">Reply</button>
              <div class="detail-reply-form" id="reply-form-${commentId}" hidden>
                <textarea class="create-field-input detail-reply-textarea" placeholder="Write a reply..." rows="2" aria-label="Reply to comment"></textarea>
                <div class="detail-reply-actions">
                  <button class="post-open-button" type="button" data-submit-reply="${commentId}">Post reply</button>
                  <button class="back-button" type="button" data-cancel-reply="${commentId}">Cancel</button>
                </div>
              </div>
              ${renderReplyList(comment.replies)}
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

/**
 * Renders the reactions section with clickable reaction pills and an emoji picker.
 * @param {Array} reactions - Array of reaction objects with symbol, count, and reactors.
 * @param {string} currentUserName - The logged-in user's name for highlighting own reactions.
 * @returns {string} HTML string for the full reactions section.
 */
function renderReactions(reactions = [], currentUserName = '') {
  const reactionHtml =
    Array.isArray(reactions) && reactions.length > 0
      ? `<ul class="detail-reaction-list">
          ${reactions
            .map((reaction) => {
              const symbol = escapeHtml(reaction.symbol || '?');
              const count = Number(reaction.count || 0);
              const reactors = Array.isArray(reaction.reactors) ? reaction.reactors : [];
              const hasReacted = reactors.includes(currentUserName);
              return `<li class="detail-reaction-item">
                <button class="detail-reaction-btn${hasReacted ? ' is-active' : ''}" type="button" data-react-symbol="${symbol}">${symbol} ${count}</button>
              </li>`;
            })
            .join('')}
        </ul>`
      : '<p class="detail-empty">No reactions yet.</p>';

  return `
    ${reactionHtml}
    <div class="emoji-picker-container">
      <button class="post-open-button detail-add-reaction-btn" type="button" id="toggle-emoji-picker">+ React</button>
      <div class="emoji-picker" id="emoji-picker" hidden>
        ${EMOJI_OPTIONS.map((emoji) => `<button class="emoji-btn" type="button" data-react-symbol="${emoji}">${emoji}</button>`).join('')}
      </div>
    </div>
  `;
}

function renderCommentForm() {
  return `
    <form class="detail-comment-form" id="comment-form" novalidate>
      <textarea
        class="create-field-input detail-comment-textarea"
        id="comment-body"
        placeholder="Write a comment..."
        rows="3"
        aria-label="Comment"
        maxlength="500"
      ></textarea>
      <div class="detail-comment-actions">
        <button class="post-open-button" type="submit" id="comment-submit" disabled>Post comment</button>
      </div>
      <p class="feed-message" id="comment-message" aria-live="polite"></p>
    </form>
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
  const postId = escapeHtml(String(post?.id || ''));
  const currentUserName = String(currentUser?.name || '');

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
        ${renderReactions(post?.reactions, currentUserName)}
      </section>

      <section class="post-detail-section">
        <h2>Comments</h2>
        ${renderComments(post?.comments)}
        ${renderCommentForm()}
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

  async function loadAndRender() {
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
    const commentBody = contentElement.querySelector('#comment-body');
    const commentSubmit = contentElement.querySelector('#comment-submit');
    const commentMessage = contentElement.querySelector('#comment-message');
    const commentForm = contentElement.querySelector('#comment-form');

    profileButton?.addEventListener('click', () => {
      const profileName = profileButton.getAttribute('data-profile-name');
      if (profileName) window.location.hash = `#profile?name=${encodeURIComponent(profileName)}`;
    });

    editButton?.addEventListener('click', () => {
      window.location.hash = `#edit?id=${encodeURIComponent(postId)}`;
    });

    deleteButton?.addEventListener('click', async () => {
      const postTitle = deleteButton.getAttribute('data-post-title') || 'this post';
      const confirmed = await showConfirmDialog({
        title: 'Delete Post',
        message: `Are you sure you want to delete "${postTitle}"?`,
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

    commentBody?.addEventListener('input', () => {
      if (commentSubmit) commentSubmit.disabled = !commentBody.value.trim();
    });

    commentForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = commentBody?.value.trim();
      if (!text) return;

      commentSubmit.disabled = true;
      commentSubmit.textContent = 'Posting...';
      commentMessage.textContent = '';
      commentMessage.classList.remove('is-error', 'is-success');

      try {
        await createComment({ accessToken, postId, commentBody: text });
        await loadAndRender();
      } catch (error) {
        if (error.status === 401) {
          clearAuthData();
          window.location.hash = '#login';
          return;
        }
        commentMessage.textContent = error.message || 'Could not post comment.';
        commentMessage.classList.add('is-error');
        commentSubmit.disabled = false;
        commentSubmit.textContent = 'Post comment';
      }
    });
  }

  contentElement.addEventListener('click', async (event) => {
    const replyBtn = event.target.closest('[data-reply-to]');
    if (replyBtn) {
      const commentId = replyBtn.getAttribute('data-reply-to');
      const replyForm = contentElement.querySelector(`#reply-form-${CSS.escape(commentId)}`);
      if (replyForm) {
        replyForm.hidden = !replyForm.hidden;
        if (!replyForm.hidden) replyForm.querySelector('textarea')?.focus();
      }
      return;
    }

    const cancelBtn = event.target.closest('[data-cancel-reply]');
    if (cancelBtn) {
      const commentId = cancelBtn.getAttribute('data-cancel-reply');
      const replyForm = contentElement.querySelector(`#reply-form-${CSS.escape(commentId)}`);
      if (replyForm) {
        replyForm.hidden = true;
        const textarea = replyForm.querySelector('textarea');
        if (textarea) textarea.value = '';
      }
      return;
    }

    const submitBtn = event.target.closest('[data-submit-reply]');
    if (submitBtn) {
      const commentId = submitBtn.getAttribute('data-submit-reply');
      const replyForm = contentElement.querySelector(`#reply-form-${CSS.escape(commentId)}`);
      const textarea = replyForm?.querySelector('textarea');
      const text = textarea?.value.trim();
      if (!text) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      try {
        await createCommentReply({ accessToken, postId, commentId, replyBody: text });
        await loadAndRender();
      } catch (error) {
        if (error.status === 401) {
          clearAuthData();
          window.location.hash = '#login';
          return;
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post reply';
      }
      return;
    }

    if (event.target.closest('#toggle-emoji-picker')) {
      const picker = contentElement.querySelector('#emoji-picker');
      if (picker) picker.hidden = !picker.hidden;
      return;
    }

    const reactBtn = event.target.closest('[data-react-symbol]');
    if (reactBtn) {
      const picker = contentElement.querySelector('#emoji-picker');
      if (picker && !picker.hidden) picker.hidden = true;

      const symbol = reactBtn.getAttribute('data-react-symbol');
      if (!symbol) return;

      try {
        await reactToPost({ accessToken, postId, symbol });
        await loadAndRender();
      } catch (error) {
        if (error.status === 401) {
          clearAuthData();
          window.location.hash = '#login';
        }
      }
    }
  });

  document.addEventListener('click', (event) => {
    const picker = contentElement.querySelector('#emoji-picker');
    if (picker && !picker.hidden && !event.target.closest('.emoji-picker-container')) {
      picker.hidden = true;
    }
  });

  await loadAndRender();
}
