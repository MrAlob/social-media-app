export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getMediaUrl(media) {
  const rawUrl = typeof media === 'string' ? media : media?.url;

  if (!rawUrl) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

export function truncateText(text, maxLength = 150) {
  const value = text || '';

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export function formatDate(dateString) {
  if (!dateString) {
    return 'Unknown date';
  }

  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) {
    return 'Unknown date';
  }

  const date = new Date(dateString);

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
