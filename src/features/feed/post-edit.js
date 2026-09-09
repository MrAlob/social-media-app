import { fetchPostById, updatePost } from '../../services/api.js';
import { clearAuthData, getAccessToken, getCurrentUser } from '../../services/storage.js';
import { getMediaUrl } from '../../utils/format.js';
import { validateMediaUrl, validatePostForm } from './post-create.js';
import { getEditPostIdFromHash } from '../../router.js';
export { getEditPostIdFromHash };

const TITLE_MAX_LENGTH = 280;
const BODY_MAX_LENGTH = 280;

export function validatePostOwnership(post, currentUser) {
  const postOwner = post?.author?.name || '';
  const currentUserName = currentUser?.name || '';
  return Boolean(postOwner && currentUserName && postOwner === currentUserName);
}

function getFormValues(form) {
  const formData = new FormData(form);

  return {
    title: formData.get('title'),
    body: formData.get('body'),
    tags: formData.get('tags'),
    media: formData.get('media'),
  };
}

function postToFormValues(post) {
  return {
    title: String(post?.title || ''),
    body: String(post?.body || ''),
    tags: Array.isArray(post?.tags) ? post.tags.join(',') : '',
    media: String(getMediaUrl(post?.media) || ''),
  };
}

function setCounter(input, counter, maxLength) {
  counter.textContent = `${input.value.length}/${maxLength}`;
}

function updatePreview(mediaUrl, previewImage, previewMessage) {
  const trimmedUrl = String(mediaUrl || '').trim();

  if (!trimmedUrl) {
    previewImage.hidden = true;
    previewImage.src = '';
    previewMessage.textContent = 'Enter an image URL to preview media.';
    return;
  }

  if (!validateMediaUrl(trimmedUrl)) {
    previewImage.hidden = true;
    previewImage.src = '';
    previewMessage.textContent = 'Preview unavailable. URL must be a valid image link.';
    return;
  }

  previewImage.hidden = false;
  previewImage.src = trimmedUrl;
  previewMessage.textContent = 'Preview looks good.';
}

function clearMessages(ui) {
  ui.message.textContent = '';
  ui.message.classList.remove('is-error', 'is-success');
  ui.errors.title.textContent = '';
  ui.errors.body.textContent = '';
  ui.errors.tags.textContent = '';
  ui.errors.media.textContent = '';
}

function showValidationErrors(ui, errors) {
  ui.errors.title.textContent = errors.title || '';
  ui.errors.body.textContent = errors.body || '';
  ui.errors.tags.textContent = errors.tags || '';
  ui.errors.media.textContent = errors.media || '';
}

function setSubmitState(button, isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Updating...' : 'Update Post';
}

function fillForm(ui, values) {
  ui.titleInput.value = values.title;
  ui.bodyInput.value = values.body;
  ui.tagsInput.value = values.tags;
  ui.mediaInput.value = values.media;

  setCounter(ui.titleInput, ui.titleCounter, TITLE_MAX_LENGTH);
  setCounter(ui.bodyInput, ui.bodyCounter, BODY_MAX_LENGTH);
  updatePreview(ui.mediaInput.value, ui.previewImage, ui.previewMessage);
}

function buildUi(rootElement) {
  const form = rootElement.querySelector('#edit-post-form');
  const submit = rootElement.querySelector('#edit-submit');
  const message = rootElement.querySelector('#edit-message');
  const titleInput = rootElement.querySelector('#edit-title');
  const bodyInput = rootElement.querySelector('#edit-body');
  const tagsInput = rootElement.querySelector('#edit-tags');
  const mediaInput = rootElement.querySelector('#edit-media');
  const titleCounter = rootElement.querySelector('#edit-title-counter');
  const bodyCounter = rootElement.querySelector('#edit-body-counter');
  const previewImage = rootElement.querySelector('#edit-preview-image');
  const previewMessage = rootElement.querySelector('#edit-preview-message');
  const cancelButtons = rootElement.querySelectorAll('#edit-cancel-top, #edit-cancel-bottom');

  const errors = {
    title: rootElement.querySelector('[data-edit-error-for="title"]'),
    body: rootElement.querySelector('[data-edit-error-for="body"]'),
    tags: rootElement.querySelector('[data-edit-error-for="tags"]'),
    media: rootElement.querySelector('[data-edit-error-for="media"]'),
  };

  if (
    !form ||
    !submit ||
    !message ||
    !titleInput ||
    !bodyInput ||
    !tagsInput ||
    !mediaInput ||
    !titleCounter ||
    !bodyCounter ||
    !previewImage ||
    !previewMessage ||
    cancelButtons.length === 0 ||
    !errors.title ||
    !errors.body ||
    !errors.tags ||
    !errors.media
  ) {
    return null;
  }

  return {
    form,
    submit,
    message,
    titleInput,
    bodyInput,
    tagsInput,
    mediaInput,
    titleCounter,
    bodyCounter,
    previewImage,
    previewMessage,
    cancelButtons,
    errors,
  };
}

export async function renderPostEditPage(rootElement) {
  if (!rootElement) {
    return;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    window.location.hash = '#login';
    return;
  }

  const postId = getEditPostIdFromHash();

  if (!postId) {
    rootElement.innerHTML = `
      <main class="feed-page">
        <p class="feed-message is-error">Missing post id in URL.</p>
      </main>
    `;
    return;
  }

  rootElement.innerHTML = `
    <main class="feed-page">
      <header class="detail-topbar create-topbar">
        <button class="back-button border-white/75 bg-white/45 backdrop-blur-md" id="edit-cancel-top" type="button">Cancel</button>
        <h1 class="feed-title">Edit Post</h1>
      </header>

      <section class="post-detail-card border-white/70 bg-white/35 shadow-lg shadow-slate-900/10 backdrop-blur-xl" aria-labelledby="edit-post-title">
        <h2 id="edit-post-title" class="post-detail-title">Update your post</h2>
        <p class="feed-message" id="edit-load-message" aria-live="polite">Loading post...</p>

        <form id="edit-post-form" class="create-post-form" novalidate hidden>
          <label class="field-label create-field-label" for="edit-title">Title</label>
          <input
            id="edit-title"
            name="title"
            type="text"
            maxlength="${TITLE_MAX_LENGTH}"
            required
            class="field-input create-field-input border-white/65 bg-white/55 text-slate-900 shadow-sm backdrop-blur-md"
            placeholder="Write a title"
          />
          <p class="character-counter" id="edit-title-counter">0/${TITLE_MAX_LENGTH}</p>
          <p class="field-error create-field-error" data-edit-error-for="title" aria-live="polite"></p>

          <label class="field-label create-field-label" for="edit-body">Body</label>
          <textarea
            id="edit-body"
            name="body"
            maxlength="${BODY_MAX_LENGTH}"
            class="field-input create-field-input create-textarea border-white/65 bg-white/55 text-slate-900 shadow-sm backdrop-blur-md"
            placeholder="What is on your mind?"
          ></textarea>
          <p class="character-counter" id="edit-body-counter">0/${BODY_MAX_LENGTH}</p>
          <p class="field-error create-field-error" data-edit-error-for="body" aria-live="polite"></p>

          <label class="field-label create-field-label" for="edit-tags">Tags</label>
          <input
            id="edit-tags"
            name="tags"
            type="text"
            class="field-input create-field-input border-white/65 bg-white/55 text-slate-900 shadow-sm backdrop-blur-md"
            placeholder="javascript,frontend,school"
          />
          <p class="field-hint">Use comma-separated tags and avoid spaces in each tag.</p>
          <p class="field-error create-field-error" data-edit-error-for="tags" aria-live="polite"></p>

          <label class="field-label create-field-label" for="edit-media">Media URL</label>
          <input
            id="edit-media"
            name="media"
            type="url"
            class="field-input create-field-input border-white/65 bg-white/55 text-slate-900 shadow-sm backdrop-blur-md"
            placeholder="https://example.com/image.jpg"
          />
          <p class="field-error create-field-error" data-edit-error-for="media" aria-live="polite"></p>

          <section class="media-preview border border-white/65 bg-white/42 shadow-inner backdrop-blur-lg" aria-live="polite">
            <p class="field-hint" id="edit-preview-message">Enter an image URL to preview media.</p>
            <img id="edit-preview-image" class="post-detail-media" alt="Media preview" hidden />
          </section>

          <div class="create-form-actions">
            <button class="back-button border-white/75 bg-white/45 backdrop-blur-md" id="edit-cancel-bottom" type="button">Cancel</button>
            <button class="submit-button create-submit-button border-white/70 bg-white/35 text-slate-900" id="edit-submit" type="submit">Update Post</button>
          </div>
          <p class="form-message create-form-message" id="edit-message" aria-live="polite"></p>
        </form>
      </section>
    </main>
  `;

  const ui = buildUi(rootElement);
  const loadMessage = rootElement.querySelector('#edit-load-message');

  if (!ui || !loadMessage) {
    return;
  }

  const currentUser = getCurrentUser();
  let initialSnapshot = '';

  try {
    const post = await fetchPostById({ accessToken, postId });

    if (!post) {
      loadMessage.textContent = 'Post not found.';
      loadMessage.classList.add('is-error');
      return;
    }

    if (!validatePostOwnership(post, currentUser)) {
      ui.form.hidden = true;
      loadMessage.textContent = 'You can only edit your own posts.';
      loadMessage.classList.add('is-error');
      setTimeout(() => {
        window.location.hash = '#feed';
      }, 900);
      return;
    }

    fillForm(ui, postToFormValues(post));
    loadMessage.textContent = '';
    ui.form.hidden = false;
    initialSnapshot = JSON.stringify(getFormValues(ui.form));
  } catch (error) {
    if (error.status === 401) {
      clearAuthData();
      window.location.hash = '#login';
      return;
    }
    if (error.status === 404) {
      loadMessage.textContent = 'Post not found.';
      loadMessage.classList.add('is-error');
      return;
    }
    loadMessage.textContent = error.message || 'Could not load post for editing.';
    loadMessage.classList.add('is-error');
    return;
  }

  ui.titleInput.addEventListener('input', () => {
    setCounter(ui.titleInput, ui.titleCounter, TITLE_MAX_LENGTH);
  });

  ui.bodyInput.addEventListener('input', () => {
    setCounter(ui.bodyInput, ui.bodyCounter, BODY_MAX_LENGTH);
  });

  ui.mediaInput.addEventListener('input', () => {
    updatePreview(ui.mediaInput.value, ui.previewImage, ui.previewMessage);
  });

  ui.cancelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentSnapshot = JSON.stringify(getFormValues(ui.form));
      const hasUnsavedChanges = initialSnapshot && initialSnapshot !== currentSnapshot;

      if (hasUnsavedChanges && !window.confirm('Discard unsaved changes?')) {
        return;
      }

      window.location.hash = '#feed';
    });
  });

  ui.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessages(ui);

    const validation = validatePostForm(getFormValues(ui.form));

    if (!validation.isValid) {
      showValidationErrors(ui, validation.errors);
      return;
    }

    setSubmitState(ui.submit, true);

    try {
      await updatePost({
        accessToken,
        postId,
        postData: validation.data,
      });

      ui.message.textContent = 'Post updated successfully. Redirecting to feed...';
      ui.message.classList.add('is-success');

      setTimeout(() => {
        window.location.hash = '#feed';
      }, 700);
    } catch (error) {
      if (error.status === 401) {
        clearAuthData();
        window.location.hash = '#login';
        return;
      }

      ui.message.textContent = error.message || 'Could not update post.';
      ui.message.classList.add('is-error');
    } finally {
      setSubmitState(ui.submit, false);
    }
  });
}
