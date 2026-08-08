const FAVICON_PATHS = [
  '/favicon.svg',
  '/favicon.png',
  '/favicon.ico',
] as const;

export const getFaviconCandidates = (href?: string) => {
  if (!href) return [];

  try {
    const origin = new URL(href);

    if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
      return [];
    }

    // Profile pages are served over HTTPS, so favicon requests must be secure
    // as well. Preserve non-default ports while discarding URL credentials.
    origin.protocol = 'https:';
    origin.username = '';
    origin.password = '';

    return FAVICON_PATHS.map((path) => new URL(path, origin).href);
  } catch {
    return [];
  }
};

export const getNextFaviconCandidate = (
  candidates: string[],
  currentCandidate: string | null,
) => {
  if (!currentCandidate) return candidates[0] ?? null;

  const currentIndex = candidates.indexOf(currentCandidate);

  return currentIndex === -1
    ? (candidates[0] ?? null)
    : (candidates[currentIndex + 1] ?? null);
};
