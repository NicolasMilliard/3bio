import type { PlatformName } from '@/constants';
import type { LensLink } from '@/schemas/threeBioMetadata.schema';
import { getHostname } from './getHostname';

export type SocialLink = {
  key: string;
  platform: PlatformName;
  value: string;
};

export const formatSocialLink = (link: LensLink) => {
  const hostname = getHostname(link.value);
  const hostnamePlatform = hostname?.replace(/^www\./, '').split('.')[0];
  const platform = hostnamePlatform === 'x' ? 'twitter' : hostnamePlatform;

  return {
    key: link.key,
    platform,
    value: link.value,
  };
};
