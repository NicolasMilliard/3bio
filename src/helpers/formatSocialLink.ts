import type { PlatformName } from '@/constants';
import type { LensLink } from '@/schemas/inBioMetadata.schema';
import { getHostname } from './getHostname';

export type SocialLink = {
  key: string;
  platform: PlatformName;
  value: string;
};

export const formatSocialLink = (link: LensLink) => {
  const hostname = getHostname(link.value);
  const platform = hostname?.replace(/^www\./, '').split('.')[0];

  return {
    key: link.key,
    platform,
    value: link.value,
  };
};
