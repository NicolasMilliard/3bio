export const GROVE_MEDIA_ORIGIN = 'https://api.grove.storage';
const LOCAL_MEDIA_BASE = 'https://local-media.invalid';

type TrustedMediaOptions = {
  allowBlob?: boolean;
  siteOrigin?: string;
};

const getBrowserOrigin = () =>
  typeof window === 'undefined' ? undefined : window.location.origin;

const isSameOrigin = (url: URL, origin?: string) => {
  if (!origin) return false;

  try {
    return url.origin === new URL(origin).origin;
  } catch {
    return false;
  }
};

/**
 * Returns a renderable URL only when it cannot contact an arbitrary host.
 * Profile-owned media is limited to Grove; root-relative assets stay on the
 * current site, and short-lived blob URLs are opt-in for the editor preview.
 */
export const getTrustedMediaUrl = (
  value?: string | null,
  { allowBlob = false, siteOrigin = getBrowserOrigin() }: TrustedMediaOptions = {},
) => {
  const candidate = value?.trim();

  if (!candidate) return undefined;

  if (candidate.startsWith('/')) {
    try {
      const baseUrl = new URL(siteOrigin ?? LOCAL_MEDIA_BASE);
      const url = new URL(candidate, baseUrl);

      if (url.origin !== baseUrl.origin) return undefined;

      return siteOrigin
        ? url.toString()
        : `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return undefined;
    }
  }

  if (allowBlob && candidate.startsWith('blob:')) {
    return candidate;
  }

  try {
    const url = new URL(candidate);

    if (url.protocol !== 'https:') return undefined;

    return url.origin === GROVE_MEDIA_ORIGIN || isSameOrigin(url, siteOrigin)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};
