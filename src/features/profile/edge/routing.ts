const PROFILE_HANDLE_PATTERN = /^[a-zA-Z0-9._-]+$/;
const INTERNAL_APP_PATHS = new Set(['/app/dashboard', '/app/edit']);
const RESERVED_PATHS = new Set([
  'favicon.ico',
  'favicon.svg',
  'index.html',
  'og.png',
  'robots.txt',
  'sitemap.xml',
]);

export const isInternalAppPath = (pathname: string) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  return INTERNAL_APP_PATHS.has(normalizedPath);
};

export const decodePathSegments = (
  path: string | string[] | undefined,
): string[] | undefined => {
  if (path === undefined) return undefined;

  const rawSegments = Array.isArray(path) ? path : path.split('/');

  try {
    return rawSegments.map((segment) => decodeURIComponent(segment));
  } catch {
    return undefined;
  }
};

export const isProfilePageId = (pageId: string) =>
  !RESERVED_PATHS.has(pageId.toLowerCase()) &&
  PROFILE_HANDLE_PATTERN.test(pageId) &&
  /[a-zA-Z0-9]/.test(pageId);

export const getPublicOrigin = (url: URL) =>
  url.hostname === '3bio.social' || url.hostname === 'www.3bio.social'
    ? 'https://3bio.social'
    : url.origin;

export const getCanonicalProfileUrl = (
  requestUrl: URL,
  normalizedHandle: string,
) => {
  const canonicalOrigin = getPublicOrigin(requestUrl);
  const canonicalPath = `/${encodeURIComponent(normalizedHandle)}`;

  if (
    requestUrl.pathname === canonicalPath &&
    requestUrl.origin === canonicalOrigin
  ) {
    return undefined;
  }

  const canonicalUrl = new URL(canonicalPath, canonicalOrigin);
  canonicalUrl.search = requestUrl.search;

  return canonicalUrl;
};
