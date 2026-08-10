import { SOCIAL_MAP, type PlatformName } from '@/constants';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { formatSocialLink } from '@/helpers';
import type { LensLink } from '@/schemas/threeBioMetadata.schema';

export type SocialLinkFormValue = NonNullable<
  MetadataFormValues['socialLinks']
>[number];

type SocialLinkValues = readonly SocialLinkFormValue[] | null | undefined;
type PersistedSocialLink = Pick<LensLink, 'key' | 'value'> & {
  platform?: PlatformName;
};

const SOCIAL_PLATFORM_NAMES = Object.keys(SOCIAL_MAP) as PlatformName[];

export const isActiveSocialLink = (link: SocialLinkFormValue) =>
  Boolean(link.url?.trim());

const partitionSocialLinks = (socialLinks: SocialLinkValues) => {
  const active: SocialLinkFormValue[] = [];
  const inactive: SocialLinkFormValue[] = [];

  for (const link of socialLinks ?? []) {
    (isActiveSocialLink(link) ? active : inactive).push(link);
  }

  return { active, inactive };
};

export const hydrateSocialLinks = (
  persistedSocialLinks?: readonly PersistedSocialLink[],
): SocialLinkFormValue[] => {
  const active: SocialLinkFormValue[] = [];
  const activePlatforms = new Set<PlatformName>();

  for (const persistedLink of persistedSocialLinks ?? []) {
    const { platform, value } = formatSocialLink(persistedLink);

    if (!platform || activePlatforms.has(platform)) continue;

    activePlatforms.add(platform);
    active.push({ platform, url: value });
  }

  const inactive = SOCIAL_PLATFORM_NAMES.filter(
    (platform) => !activePlatforms.has(platform),
  ).map((platform) => ({ platform, url: undefined }));

  return [...active, ...inactive];
};

export const reorderActiveSocialLinks = (
  socialLinks: SocialLinkValues,
  activePlatform: PlatformName,
  overPlatform: PlatformName,
): SocialLinkFormValue[] => {
  const { active, inactive } = partitionSocialLinks(socialLinks);
  const fromIndex = active.findIndex(
    ({ platform }) => platform === activePlatform,
  );
  const toIndex = active.findIndex(({ platform }) => platform === overPlatform);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return [...active, ...inactive];
  }

  const reorderedActive = [...active];
  const [movedLink] = reorderedActive.splice(fromIndex, 1);

  if (!movedLink) return [...active, ...inactive];

  reorderedActive.splice(toIndex, 0, movedLink);

  return [...reorderedActive, ...inactive];
};

export const activateSocialLink = (
  socialLinks: SocialLinkValues,
  platform: PlatformName,
  url: string,
): SocialLinkFormValue[] => {
  const existing = (socialLinks ?? []).find(
    (link) => link.platform === platform,
  );
  const remaining = (socialLinks ?? []).filter(
    (link) => link.platform !== platform,
  );
  const { active, inactive } = partitionSocialLinks(remaining);

  return [...active, { ...existing, platform, url }, ...inactive];
};

export const deactivateSocialLink = (
  socialLinks: SocialLinkValues,
  platform: PlatformName,
): SocialLinkFormValue[] => {
  const existing = (socialLinks ?? []).find(
    (link) => link.platform === platform,
  );
  const remaining = (socialLinks ?? []).filter(
    (link) => link.platform !== platform,
  );
  const { active, inactive } = partitionSocialLinks(remaining);

  if (!existing) return [...active, ...inactive];

  return [...active, { ...existing, platform, url: '' }, ...inactive];
};
