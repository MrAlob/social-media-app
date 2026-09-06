import { createPost } from '../../services/api.js';
import { getAccessToken } from '../../services/storage.js';
import { getMediaUrl } from '../../utils/format.js';

const TITLE_MAX_LENGTH = 280;
const BODY_MAX_LENGTH = 280;
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

export function validateMediaUrl(url) {
	const mediaUrl = String(url || '').trim();

	if (!mediaUrl) {
		return true;
	}

	const parsedUrl = getMediaUrl(mediaUrl);

	if (!parsedUrl) {
		return false;
	}

	try {
		const pathname = new URL(parsedUrl).pathname.toLowerCase();
		return Array.from(IMAGE_EXTENSIONS).some((ext) => pathname.endsWith(ext));
	} catch {
		return false;
	}
}

function parseTags(tagsInput) {
	return String(tagsInput || '')
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

export function validatePostForm(formData) {
	const errors = {};
	const title = String(formData.title || '').trim();
	const body = String(formData.body || '').trim();
	const media = String(formData.media || '').trim();
	const tags = parseTags(formData.tags);

	if (!title) {
		errors.title = 'Title is required';
	}

	if (title.length > TITLE_MAX_LENGTH) {
		errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
	}

	if (body.length > BODY_MAX_LENGTH) {
		errors.body = `Body must be ${BODY_MAX_LENGTH} characters or less`;
	}

	const invalidTag = tags.find((tag) => /\s/.test(tag));

	if (invalidTag) {
		errors.tags = 'Tags cannot contain spaces. Use comma-separated tags.';
	}

	if (media && !validateMediaUrl(media)) {
		errors.media = 'Use a valid image URL ending in jpg, jpeg, png, gif, or webp';
	}

	const data = {
		title,
	};

	if (body) {
		data.body = body;
	}

	if (tags.length > 0) {
		data.tags = tags;
	}

	if (media) {
		data.media = {
			url: media,
			alt: title || 'Post media',
		};
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
		data,
	};
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
	button.textContent = isLoading ? 'Creating...' : 'Create Post';
}

async function submitCreatePostForm(event, ui, accessToken) {
	event.preventDefault();
	clearMessages(ui);

	const validation = validatePostForm(getFormValues(ui.form));

	if (!validation.isValid) {
		showValidationErrors(ui, validation.errors);
		return;
	}

	setSubmitState(ui.submit, true);

	try {
		await createPost({ accessToken, postData: validation.data });
		ui.message.textContent = 'Post created successfully. Redirecting to feed...';
		ui.message.classList.add('is-success');

		setTimeout(() => {
			window.location.hash = '#feed';
		}, 700);
	} catch (error) {
		ui.message.textContent = error.message || 'Could not create post.';
		ui.message.classList.add('is-error');
	} finally {
		setSubmitState(ui.submit, false);
	}
}

function buildUi(rootElement) {
	const form = rootElement.querySelector('#create-post-form');
	const submit = rootElement.querySelector('#create-submit');
	const message = rootElement.querySelector('#create-message');
	const titleInput = rootElement.querySelector('#create-title');
	const bodyInput = rootElement.querySelector('#create-body');
	const mediaInput = rootElement.querySelector('#create-media');
	const titleCounter = rootElement.querySelector('#title-counter');
	const bodyCounter = rootElement.querySelector('#body-counter');
	const previewImage = rootElement.querySelector('#preview-image');
	const previewMessage = rootElement.querySelector('#preview-message');
	const cancelButtons = rootElement.querySelectorAll('#create-cancel-top, #create-cancel-bottom');

	const errors = {
		title: rootElement.querySelector('[data-error-for="title"]'),
		body: rootElement.querySelector('[data-error-for="body"]'),
		tags: rootElement.querySelector('[data-error-for="tags"]'),
		media: rootElement.querySelector('[data-error-for="media"]'),
	};

	if (
		!form ||
		!submit ||
		!message ||
		!titleInput ||
		!bodyInput ||
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
		mediaInput,
		titleCounter,
		bodyCounter,
		previewImage,
		previewMessage,
		cancelButtons,
		errors,
	};
}

export function renderPostCreatePage(rootElement) {
	if (!rootElement) {
		return;
	}

	const accessToken = getAccessToken();

	if (!accessToken) {
		window.location.hash = '#login';
		return;
	}

	rootElement.innerHTML = `
		<main class="feed-page bg-slate-50">
			<header class="detail-topbar create-topbar">
				<button class="back-button" id="create-cancel-top" type="button">Cancel</button>
				<h1 class="feed-title">Create Post</h1>
			</header>

			<section class="post-detail-card max-w-2xl shadow-sm" aria-labelledby="create-post-title">
				<h2 id="create-post-title" class="post-detail-title">New Post</h2>
				<form id="create-post-form" class="create-post-form">
					<label class="field-label create-field-label" for="create-title">Title</label>
					<input
						id="create-title"
						name="title"
						type="text"
						maxlength="${TITLE_MAX_LENGTH}"
						required
						class="field-input create-field-input shadow-sm"
						placeholder="Write a title"
					/>
					<p class="character-counter" id="title-counter">0/${TITLE_MAX_LENGTH}</p>
					<p class="field-error create-field-error" data-error-for="title" aria-live="polite"></p>

					<label class="field-label create-field-label" for="create-body">Body</label>
					<textarea
						id="create-body"
						name="body"
						maxlength="${BODY_MAX_LENGTH}"
						class="field-input create-field-input create-textarea shadow-sm"
						placeholder="What is on your mind?"
					></textarea>
					<p class="character-counter" id="body-counter">0/${BODY_MAX_LENGTH}</p>
					<p class="field-error create-field-error" data-error-for="body" aria-live="polite"></p>

					<label class="field-label create-field-label" for="create-tags">Tags</label>
					<input
						id="create-tags"
						name="tags"
						type="text"
						class="field-input create-field-input shadow-sm"
						placeholder="javascript,frontend,school"
					/>
					<p class="field-hint">Use comma-separated tags and avoid spaces in each tag.</p>
					<p class="field-error create-field-error" data-error-for="tags" aria-live="polite"></p>

					<label class="field-label create-field-label" for="create-media">Media URL</label>
					<input
						id="create-media"
						name="media"
						type="url"
						class="field-input create-field-input shadow-sm"
						placeholder="https://example.com/image.jpg"
					/>
					<p class="field-error create-field-error" data-error-for="media" aria-live="polite"></p>

					<section class="media-preview shadow-inner" aria-live="polite">
						<p class="field-hint" id="preview-message">Enter an image URL to preview media.</p>
						<img id="preview-image" class="post-detail-media" alt="Media preview" hidden />
					</section>

					<div class="create-form-actions">
						<button class="back-button" id="create-cancel-bottom" type="button">Cancel</button>
						<button class="submit-button create-submit-button" id="create-submit" type="submit">Create Post</button>
					</div>
					<p class="form-message create-form-message" id="create-message" aria-live="polite"></p>
				</form>
			</section>
		</main>
	`;

	const ui = buildUi(rootElement);

	if (!ui) {
		return;
	}

	setCounter(ui.titleInput, ui.titleCounter, TITLE_MAX_LENGTH);
	setCounter(ui.bodyInput, ui.bodyCounter, BODY_MAX_LENGTH);

	ui.titleInput.addEventListener('input', () => {
		setCounter(ui.titleInput, ui.titleCounter, TITLE_MAX_LENGTH);
	});

	ui.bodyInput.addEventListener('input', () => {
		setCounter(ui.bodyInput, ui.bodyCounter, BODY_MAX_LENGTH);
	});

	ui.mediaInput.addEventListener('input', () => {
		updatePreview(ui.mediaInput.value, ui.previewImage, ui.previewMessage);
	});

	updatePreview(ui.mediaInput.value, ui.previewImage, ui.previewMessage);

	ui.cancelButtons.forEach((button) => {
		button.addEventListener('click', () => {
			window.location.hash = '#feed';
		});
	});

	ui.form.addEventListener('submit', (event) => {
		submitCreatePostForm(event, ui, accessToken);
	});
}
