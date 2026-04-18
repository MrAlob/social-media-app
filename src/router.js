function getHashParam(prefix, param) {
  const hash = window.location.hash || '';
  if (!hash.startsWith(prefix)) return '';
  return new URLSearchParams(hash.split('?')[1] || '').get(param) || '';
}

export const getPostIdFromHash = () => getHashParam('#post', 'id');
export const getEditPostIdFromHash = () => getHashParam('#edit', 'id');
export const getProfileNameFromHash = () => getHashParam('#profile', 'name');

export function createRoutes(handlers) {
  return [
    { matches: (hash) => hash === '#login' || hash === '', requiresAuth: false, render: handlers.renderLoginPage },
    { matches: (hash) => hash === '#register', requiresAuth: false, render: handlers.renderRegisterPage },
    { matches: (hash) => hash === '#feed', requiresAuth: true, render: handlers.renderFeedPage },
    { matches: (hash) => hash === '#create', requiresAuth: true, render: handlers.renderPostCreatePage },
    { matches: (hash) => hash.startsWith('#post'), requiresAuth: true, render: (el) => handlers.renderPostDetailPage(el, getPostIdFromHash()) },
    { matches: (hash) => hash.startsWith('#edit'), requiresAuth: true, render: handlers.renderPostEditPage },
    { matches: (hash) => hash.startsWith('#profile'), requiresAuth: true, render: handlers.renderUserProfilePage },
    { matches: (hash) => hash === '#my-profile', requiresAuth: true, render: handlers.renderMyProfilePage },
    { matches: () => true, requiresAuth: false, render: handlers.renderLoginPage },
  ];
}

export function getMatchingRoute(hash, routes) {
  return routes.find((route) => route.matches(hash));
}

export function canAccessRoute(route, hasToken) {
  if (!route?.requiresAuth) return true;
  return Boolean(hasToken);
}
