export function getApiConfig(options = {}) {
  const { requireApiKey = false } = options;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_NOROFF_API_KEY;

  if (!apiBaseUrl) {
    throw new Error('Missing VITE_API_BASE_URL in .env');
  }

  if (requireApiKey && !apiKey) {
    throw new Error('Missing VITE_NOROFF_API_KEY in .env');
  }

  return {
    apiBaseUrl,
    apiKey,
  };
}
