import { SOCIAL_MAP, type PlatformName } from '@/constants';
import type { LensLink } from '@/schemas/threeBioMetadata.schema';
import { getHostname } from './getHostname';

type SocialLink = {
  key: string;
  platform?: PlatformName;
  value: string;
};

export const formatSocialLink = (
  link: Pick<LensLink, 'key' | 'value'> & { platform?: PlatformName },
): SocialLink => {
  const storedPlatform = link.key.startsWith('socialLinks.')
    ? link.key.slice('socialLinks.'.length)
    : undefined;
  const hostname = getHostname(link.value);
  const hostnamePlatform = hostname?.replace(/^www\./, '').split('.')[0];
  const inferredPlatform =
    hostnamePlatform === 'x'
      ? 'twitter'
      : hostnamePlatform === 'bsky'
        ? 'bluesky'
        : hostnamePlatform;
  const isPlatformName = (value?: string): value is PlatformName =>
    !!value && value in SOCIAL_MAP;
  const platform = [link.platform, inferredPlatform, storedPlatform].find(
    (candidate): candidate is PlatformName =>
      isPlatformName(candidate) &&
      SOCIAL_MAP[candidate].validateUrl(link.value),
  );

  return {
    key: link.key,
    platform,
    value: link.value,
  };
};
