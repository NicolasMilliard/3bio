const DESCRIPTION_MAX_LENGTH = 160;

export const HOME_TITLE = '3bio | Decentralized link in bio for Lens';
export const HOME_DESCRIPTION =
  'Turn your Lens profile into a customizable link in bio page you can share. Open source and built on Lens.';
export const DEFAULT_SOCIAL_IMAGE_PATH = '/og.png';
export const DEFAULT_SOCIAL_IMAGE_ALT =
  '3bio — decentralized link in bio for Lens';

export type ProfileMetadataStatus = 'loading' | 'ready' | 'not-found' | 'error';

export type ProfileMetadataProfile = {
  avatar?: string;
  bio?: string | null;
  coverPicture?: string;
  name?: string | null;
  socialLinks?: Array<{
    value: string;
  }>;
};

type ProfileDocumentMetadataInput = {
  origin: string;
  lensHandle: string;
  profile?: ProfileMetadataProfile;
  followers?: number;
  following?: number;
  posts?: number;
  displayStatistics?: boolean;
  status: ProfileMetadataStatus;
  defaultSocialImageUrl?: string;
};

type SocialImageKind = 'cover' | 'avatar' | 'default';

export type ProfileDocumentMetadataModel = {
  canonicalUrl: string;
  description: string;
  displayName: string;
  isIndexable: boolean;
  normalizedHandle: string;
  robots: string;
  socialImageAlt?: string;
  socialImageKind?: SocialImageKind;
  socialImageUrl?: string;
  structuredData?: Record<string, unknown>;
  title: string;
  twitterCard: 'summary' | 'summary_large_image';
};

const normalizeText = (value?: string | null) =>
  value?.replace(/\s+/g, ' ').trim() || undefined;

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;

  const truncated = value.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  const cutoff = lastSpace > maxLength * 0.6 ? lastSpace : truncated.length;

  return `${truncated.slice(0, cutoff).trimEnd()}...`;
};

const asPublicUrl = (value?: string | null) => {
  if (!value) return undefined;

  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const asHttpsUrl = (value?: string | null) => {
  const url = asPublicUrl(value);

  return url?.startsWith('https://') ? url : undefined;
};

const interactionCounter = (interactionType: string, count?: number) =>
  Number.isFinite(count)
    ? {
        '@type': 'InteractionCounter',
        interactionType,
        userInteractionCount: count,
      }
    : undefined;

export const buildProfileDocumentMetadata = ({
  origin,
  lensHandle,
  profile,
  followers,
  following,
  posts,
  displayStatistics = true,
  status,
  defaultSocialImageUrl = `${origin}${DEFAULT_SOCIAL_IMAGE_PATH}`,
}: ProfileDocumentMetadataInput): ProfileDocumentMetadataModel => {
  const normalizedHandle = lensHandle.toLowerCase();
  const canonicalUrl = `${origin}/${encodeURIComponent(normalizedHandle)}`;
  const profileName = normalizeText(profile?.name);
  const displayName = profileName ?? `@${normalizedHandle}`;
  const title =
    status === 'not-found'
      ? 'Profile not found | 3bio'
      : status === 'error'
        ? 'Profile temporarily unavailable | 3bio'
        : profileName
          ? `${truncateText(profileName, 50)} (@${normalizedHandle}) | 3bio`
          : `@${normalizedHandle} | 3bio`;
  const normalizedBio = normalizeText(profile?.bio);
  const description =
    status === 'not-found'
      ? `The 3bio profile @${normalizedHandle} could not be found.`
      : status === 'error'
        ? `The 3bio profile @${normalizedHandle} could not be loaded right now.`
        : normalizedBio
          ? truncateText(normalizedBio, DESCRIPTION_MAX_LENGTH)
          : `Explore @${normalizedHandle}'s profile and links on 3bio, built on Lens.`;
  const avatarUrl = asHttpsUrl(profile?.avatar);
  const coverPictureUrl = asHttpsUrl(profile?.coverPicture);
  const fallbackImageUrl = asHttpsUrl(defaultSocialImageUrl);
  const socialImageKind: SocialImageKind | undefined = coverPictureUrl
    ? 'cover'
    : avatarUrl
      ? 'avatar'
      : fallbackImageUrl
        ? 'default'
        : undefined;
  const socialImageUrl =
    coverPictureUrl ?? avatarUrl ?? fallbackImageUrl ?? undefined;
  const socialImageAlt = socialImageUrl
    ? socialImageKind === 'default'
      ? DEFAULT_SOCIAL_IMAGE_ALT
      : `${displayName}'s profile image`
    : undefined;
  const isIndexable = status === 'ready';

  const sameAs = Array.from(
    new Set(
      profile?.socialLinks
        ?.map((link) => asPublicUrl(link.value))
        .filter((url): url is string => Boolean(url)) ?? [],
    ),
  );

  const interactionStatistics = displayStatistics
    ? [
        interactionCounter('https://schema.org/FollowAction', followers),
        interactionCounter('https://schema.org/WriteAction', posts),
      ].filter((statistic) => statistic !== undefined)
    : [];
  const agentInteractionStatistic = displayStatistics
    ? interactionCounter('https://schema.org/FollowAction', following)
    : undefined;

  const structuredData =
    status === 'ready'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url: canonicalUrl,
          mainEntity: {
            '@type': 'Person',
            '@id': `${canonicalUrl}#profile`,
            name: displayName,
            alternateName: `@${normalizedHandle}`,
            identifier: normalizedHandle,
            url: canonicalUrl,
            ...(normalizedBio ? { description: normalizedBio } : {}),
            ...(avatarUrl ? { image: avatarUrl } : {}),
            ...(sameAs.length > 0 ? { sameAs } : {}),
            ...(interactionStatistics.length > 0
              ? { interactionStatistic: interactionStatistics }
              : {}),
            ...(agentInteractionStatistic ? { agentInteractionStatistic } : {}),
          },
        }
      : undefined;

  return {
    canonicalUrl,
    description,
    displayName,
    isIndexable,
    normalizedHandle,
    robots: isIndexable
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, nofollow',
    socialImageAlt,
    socialImageKind,
    socialImageUrl,
    structuredData,
    title,
    twitterCard:
      socialImageKind === 'cover' || socialImageKind === 'default'
        ? 'summary_large_image'
        : 'summary',
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const metadataAttribute = 'data-3bio-server-metadata';

const meta = (attribute: 'name' | 'property', key: string, content: string) =>
  `<meta ${metadataAttribute} ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`;

export const renderProfileDocumentHead = (
  metadata: ProfileDocumentMetadataModel,
) => {
  const tags = [
    `<title ${metadataAttribute}>${escapeHtml(metadata.title)}</title>`,
    meta('name', 'description', metadata.description),
    meta('name', 'robots', metadata.robots),
  ];

  if (metadata.isIndexable) {
    tags.push(
      `<link ${metadataAttribute} rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}" />`,
      meta('property', 'og:type', 'profile'),
      meta('property', 'og:site_name', '3bio'),
      meta('property', 'og:title', metadata.title),
      meta('property', 'og:description', metadata.description),
      meta('property', 'og:url', metadata.canonicalUrl),
      meta('property', 'profile:username', metadata.normalizedHandle),
      meta('name', 'twitter:card', metadata.twitterCard),
      meta('name', 'twitter:title', metadata.title),
      meta('name', 'twitter:description', metadata.description),
    );

    if (metadata.socialImageUrl && metadata.socialImageAlt) {
      tags.push(
        meta('property', 'og:image', metadata.socialImageUrl),
        meta('property', 'og:image:secure_url', metadata.socialImageUrl),
        meta('property', 'og:image:alt', metadata.socialImageAlt),
        meta('name', 'twitter:image', metadata.socialImageUrl),
        meta('name', 'twitter:image:alt', metadata.socialImageAlt),
      );

      if (metadata.socialImageKind === 'default') {
        tags.push(
          meta('property', 'og:image:type', 'image/png'),
          meta('property', 'og:image:width', '1200'),
          meta('property', 'og:image:height', '630'),
        );
      }
    }

    if (metadata.structuredData) {
      tags.push(
        `<script ${metadataAttribute} type="application/ld+json">${JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c')}</script>`,
      );
    }
  }

  return tags.join('\n    ');
};
