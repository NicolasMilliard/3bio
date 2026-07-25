export const formatUrlLabel = (url: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, '');

    return parsed.host + pathname + parsed.search + parsed.hash;
  } catch {
    // fallback for invalid URLs
    return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  }
};
