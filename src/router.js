export function getPostIdFromHash(hashValue = window.location.hash || '') {
  if (!hashValue.startsWith('#post')) {
    return '';
  }

  const queryString = hashValue.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  return params.get('id') || '';
}

export function getEditPostIdFromHash(hashValue = window.location.hash || '') {
  if (!hashValue.startsWith('#edit')) {
    return '';
  }

  const queryString = hashValue.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  return params.get('id') || '';
}

export function getProfileNameFromHash(hashValue = window.location.hash || '') {
  if (!hashValue.startsWith('#profile')) {
    return '';
  }

  const queryString = hashValue.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  return params.get('name') || '';
}

export function createRoutes(handlers) {
  return [
    {
      matches: (hash) => hash === '#login' || hash === '',
      requiresAuth: false,
      render: (rootElement) => handlers.renderLoginPage(rootElement),
    },
    {
      matches: (hash) => hash === '#register',
      requiresAuth: false,
      render: (rootElement) => handlers.renderRegisterPage(rootElement),
    },
    {
      matches: (hash) => hash === '#feed',
      requiresAuth: true,
      render: (rootElement) => handlers.renderFeedPage(rootElement),
    },
    {
      matches: (hash) => hash === '#create',
      requiresAuth: true,
      render: (rootElement) => handlers.renderPostCreatePage(rootElement),
    },
    {
      matches: (hash) => hash.startsWith('#post'),
      requiresAuth: true,
      render: (rootElement) => handlers.renderPostDetailPage(rootElement, getPostIdFromHash()),
    },
    {
      matches: (hash) => hash.startsWith('#edit'),
      requiresAuth: true,
      render: (rootElement) => handlers.renderPostEditPage(rootElement),
    },
    {
      matches: (hash) => hash.startsWith('#profile'),
      requiresAuth: true,
      render: (rootElement) => handlers.renderUserProfilePage(rootElement),
    },
    {
      matches: (hash) => hash === '#my-profile',
      requiresAuth: true,
      render: (rootElement) => handlers.renderMyProfilePage(rootElement),
    },
    {
      matches: () => true,
      requiresAuth: false,
      render: (rootElement) => handlers.renderLoginPage(rootElement),
    },
  ];
}

export function getMatchingRoute(hash, routes) {
  return routes.find((route) => route.matches(hash));
}

export function canAccessRoute(route, hasToken) {
  if (!route?.requiresAuth) {
    return true;
  }

  return Boolean(hasToken);
}
