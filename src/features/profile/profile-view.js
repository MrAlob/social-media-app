import {
  fetchProfileByName,
  fetchProfilePosts,
  followProfile,
  unfollowProfile,
} from '../../services/api.js';
import { clearAuthData, getAccessToken, getCurrentUser } from '../../services/storage.js';
import { escapeHtml, formatDate, getMediaUrl, truncateText } from '../../utils/format.js';

export function formatCount(value) {
  const count = Number(value || 0);

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace('.0', '')}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace('.0', '')}K`;
  }

  return String(count);
}

export function isFollowingProfile(profile, currentUserName) {
  const followers = Array.isArray(profile?.followers) ? profile.followers : [];

  return followers.some((follower) => {
    const followerName = typeof follower === 'string' ? follower : follower?.name;
    return String(followerName || '') === String(currentUserName || '');
  });
}

function updateFollowButton(button, isFollowing, isLoading) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.disabled = isLoading;
  button.classList.toggle('follow-button-following', isFollowing);

  if (isLoading) {
    button.textContent = isFollowing ? 'Unfollowing...' : 'Following...';
    return;
  }

  button.textContent = isFollowing ? 'Following' : 'Follow';
}

function resolveProfileName(profileName) {
  if (profileName) {
    return profileName;
  }

  const hash = window.location.hash || '';

  if (!hash.startsWith('#profile')) {
    return '';
  }

  const queryString = hash.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  return params.get('name') || '';
}

function renderProfileHeader(profile, isOwnProfile) {
  const bannerUrl = getMediaUrl(profile?.banner);
  const avatarUrl = getMediaUrl(profile?.avatar);
  const name = escapeHtml(profile?.name || 'Unknown user');
  const email = escapeHtml(profile?.email || 'No email');
  const postsCount = formatCount(profile?._count?.posts || 0);
  const followersCount = formatCount(profile?._count?.followers || 0);
  const followingCount = formatCount(profile?._count?.following || 0);

  return `
    <section class="profile-header-card">
      <div class="profile-banner" style="background-image: ${bannerUrl ? `url('${bannerUrl}')` : 'linear-gradient(135deg, #f1f5f9, #dbeafe)'}"></div>
      <div class="profile-header-main">
        ${
          avatarUrl
            ? `<img class="profile-avatar" src="${avatarUrl}" alt="${name} avatar" loading="lazy" />`
            : '<div class="profile-avatar placeholder">👤</div>'
        }
        <div class="profile-header-text">
          <h1 class="feed-title">${name}</h1>
          <p class="feed-subtitle">${email}</p>
          <div class="profile-stats">
            <span><strong>${postsCount}</strong> posts</span>
            <span><strong id="profile-followers-count">${followersCount}</strong> followers</span>
            <span><strong>${followingCount}</strong> following</span>
          </div>
        </div>
        <div class="profile-header-actions">
          ${
            isOwnProfile
              ? '<button class="back-button" type="button" id="profile-edit-button" disabled>Edit Profile</button>'
              : '<button class="follow-button" type="button" id="profile-follow-button">Follow</button>'
          }
          <button class="back-button" type="button" id="profile-back-button">Back to feed</button>
        </div>
      </div>
    </section>
  `;
}

function renderUserPostCard(post) {
  const mediaUrl = getMediaUrl(post?.media);
  const postId = escapeHtml(post?.id || '');
  const title = escapeHtml(post?.title || 'Untitled post');
  const body = escapeHtml(truncateText(post?.body || ''));
  const created = escapeHtml(formatDate(post?.created));
  const commentsCount = Number(post?._count?.comments || 0);
  const reactionsCount = Number(post?._count?.reactions || 0);

  return `
    <article class="post-card" data-profile-post-id="${postId}">
      <div class="post-header">
        <p class="post-author">${escapeHtml(post?.author?.name || 'Unknown')}</p>
        <p class="post-date">${created}</p>
      </div>
      <h2 class="post-title">${title}</h2>
      <p class="post-body">${body}</p>
      ${mediaUrl ? `<img class="post-media" src="${mediaUrl}" alt="Post media" loading="lazy" width="640" height="360" />` : ''}
      <div class="post-meta">
        <span>${commentsCount} comments</span>
        <span>${reactionsCount} reactions</span>
      </div>
      <div class="post-actions">
        <button class="post-open-button" type="button" data-post-id="${postId}">Open post</button>
      </div>
    </article>
  `;
}

export function renderUserProfilePage(rootElement, profileName) {
  if (!rootElement) {
    return;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    window.location.hash = '#login';
    return;
  }

  const resolvedProfileName = resolveProfileName(profileName);

  if (!resolvedProfileName) {
    rootElement.innerHTML = `
      <main class="feed-page">
        <p class="feed-message is-error">Missing profile name in URL.</p>
      </main>
    `;
    return;
  }

  rootElement.innerHTML = `
    <main class="feed-page">
      <p class="feed-message" id="profile-message" aria-live="polite">Loading profile...</p>
      <section id="profile-header"></section>
      <section class="feed-grid" id="profile-posts"></section>
      <button class="load-more-button" id="profile-load-more" type="button">Load More</button>
    </main>
  `;

  const profileMessage = rootElement.querySelector('#profile-message');
  const profileHeader = rootElement.querySelector('#profile-header');
  const profilePosts = rootElement.querySelector('#profile-posts');
  const loadMoreButton = rootElement.querySelector('#profile-load-more');

  if (!profileMessage || !profileHeader || !profilePosts || !loadMoreButton) {
    return;
  }

  const currentUser = getCurrentUser();
  const isOwnProfile = String(currentUser.name || '') === String(resolvedProfileName || '');
  let isFollowing = false;
  let followerCount = 0;

  let currentPage = 1;
  let isLastPage = false;
  let isLoading = false;

  async function loadProfileHeader() {
    const profile = await fetchProfileByName({ accessToken, profileName: resolvedProfileName });

    if (!profile) {
      throw new Error('Profile not found.');
    }

    isFollowing = isFollowingProfile(profile, currentUser.name);
    followerCount = Number(profile?._count?.followers || 0);

    profileHeader.innerHTML = renderProfileHeader(profile, isOwnProfile);

    const backButton = profileHeader.querySelector('#profile-back-button');
    if (backButton instanceof HTMLButtonElement) {
      backButton.addEventListener('click', () => {
        window.location.hash = '#feed';
      });
    }

    if (isOwnProfile) {
      return;
    }

    const followButton = profileHeader.querySelector('#profile-follow-button');
    const followersCountElement = profileHeader.querySelector('#profile-followers-count');

    updateFollowButton(followButton, isFollowing, false);

    if (!(followButton instanceof HTMLButtonElement) || !(followersCountElement instanceof HTMLElement)) {
      return;
    }

    followButton.addEventListener('click', async () => {
      const previousFollowingState = isFollowing;
      const previousFollowerCount = followerCount;

      isFollowing = !isFollowing;
      followerCount = isFollowing ? followerCount + 1 : Math.max(0, followerCount - 1);

      updateFollowButton(followButton, isFollowing, true);
      followersCountElement.textContent = formatCount(followerCount);

      try {
        const response = previousFollowingState
          ? await unfollowProfile({ accessToken, profileName: resolvedProfileName })
          : await followProfile({ accessToken, profileName: resolvedProfileName });

        const resolvedCount = Number(response?._count?.followers);

        if (Number.isFinite(resolvedCount)) {
          followerCount = resolvedCount;
          followersCountElement.textContent = formatCount(followerCount);
        }

        updateFollowButton(followButton, isFollowing, false);
        profileMessage.textContent = isFollowing ? 'You are now following this user.' : 'You unfollowed this user.';
        profileMessage.classList.remove('is-error');
        profileMessage.classList.add('is-success');
      } catch (error) {
        isFollowing = previousFollowingState;
        followerCount = previousFollowerCount;

        updateFollowButton(followButton, isFollowing, false);
        followersCountElement.textContent = formatCount(followerCount);

        if (error.status === 401) {
          clearAuthData();
          window.location.hash = '#login';
          return;
        }

        const messageByStatus = {
          400: 'Could not update follow state.',
          404: 'User not found.',
        };

        profileMessage.textContent = messageByStatus[error.status] || error.message || 'Could not update follow state.';
        profileMessage.classList.remove('is-success');
        profileMessage.classList.add('is-error');
      }
    });
  }

  async function loadProfilePosts() {
    if (isLoading || isLastPage) {
      return;
    }

    isLoading = true;
    loadMoreButton.disabled = true;

    try {
      const result = await fetchProfilePosts({
        accessToken,
        profileName: resolvedProfileName,
        page: currentPage,
        limit: 12,
      });

      if (result.posts.length === 0 && currentPage === 1) {
        profilePosts.innerHTML = '';
        profileMessage.textContent = 'This user has no posts yet.';
        loadMoreButton.style.display = 'none';
        isLastPage = true;
        return;
      }

      profilePosts.insertAdjacentHTML(
        'beforeend',
        result.posts.map((post) => renderUserPostCard(post)).join(''),
      );

      profileMessage.textContent = '';
      profileMessage.classList.remove('is-error', 'is-success');
      isLastPage = Boolean(result.meta?.isLastPage);

      if (isLastPage) {
        loadMoreButton.style.display = 'none';
      } else {
        currentPage += 1;
        loadMoreButton.disabled = false;
      }
    } finally {
      isLoading = false;
    }
  }

  profilePosts.addEventListener('click', (event) => {
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

  loadMoreButton.addEventListener('click', () => {
    loadProfilePosts().catch((error) => {
      if (error.status === 401) {
        clearAuthData();
        window.location.hash = '#login';
        return;
      }

      profileMessage.textContent = error.message || 'Could not load profile posts.';
      profileMessage.classList.remove('is-success');
      profileMessage.classList.add('is-error');
      loadMoreButton.disabled = false;
    });
  });

  Promise.all([loadProfileHeader(), loadProfilePosts()]).catch((error) => {
    if (error.status === 401) {
      clearAuthData();
      window.location.hash = '#login';
      return;
    }

    if (error.status === 404) {
      profileMessage.textContent = 'User not found.';
      profileMessage.classList.add('is-error');
      loadMoreButton.style.display = 'none';
      return;
    }

    profileMessage.textContent = error.message || 'Could not load profile.';
    profileMessage.classList.add('is-error');
    loadMoreButton.style.display = 'none';
  });
}
