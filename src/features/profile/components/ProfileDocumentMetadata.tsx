import { THREE_BIO_ORIGIN } from '@/constants';
import type { ThreeBioProfile } from '@/schemas/threeBioMetadata.schema';
import { useEffect } from 'react';

const DESCRIPTION_MAX_LENGTH = 160;

type ProfileDocumentMetadataProps = {
  lensHandle: string;
  profile?: ThreeBioProfile;
  followers?: number;
  following?: number;
  posts?: number;
  displayStatistics?: boolean;
  status: 'loading' | 'ready' | 'not-found';
};

const normalizeText = (value?: string | null) =>
  value?.replace(/\s+/g, ' ').trim() || undefined;

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;

  const truncated = value.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  const cutoff = lastSpace > maxLength * 0.6 ? lastSpace : truncated.length;

  return `${truncated.slice(0, cutoff).trimEnd()}…`;
};

const asPublicUrl = (value?: string | null) => {
  if (!value) return undefined;

  try {
    const url = new URL(value, THREE_BIO_ORIGIN);

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

const interactionCounter = (interactionType: string, count?: number) =>
  Number.isFinite(count)
    ? {
        '@type': 'InteractionCounter',
        interactionType,
        userInteractionCount: count,
      }
    : undefined;

export const ProfileDocumentMetadata = ({
  lensHandle,
  profile,
  followers,
  following,
  posts,
  displayStatistics = true,
  status,
}: ProfileDocumentMetadataProps) => {
  const normalizedHandle = lensHandle.toLowerCase();
  const canonicalUrl = `${THREE_BIO_ORIGIN}/${encodeURIComponent(normalizedHandle)}`;
  const profileName = normalizeText(profile?.name);
  const displayName = profileName ?? `@${normalizedHandle}`;
  const title =
    status === 'not-found'
      ? 'Profile not found | 3bio'
      : profileName
        ? `${truncateText(profileName, 50)} (@${normalizedHandle}) | 3bio`
        : `@${normalizedHandle} | 3bio`;
  const normalizedBio = normalizeText(profile?.bio);
  const description =
    status === 'not-found'
      ? `The 3bio profile @${normalizedHandle} could not be found.`
      : normalizedBio
        ? truncateText(normalizedBio, DESCRIPTION_MAX_LENGTH)
        : `Explore @${normalizedHandle}'s profile and links on 3bio, built on Lens.`;
  const avatarUrl = asPublicUrl(profile?.avatar);
  const coverPictureUrl = asPublicUrl(profile?.coverPicture);
  const socialImageUrl = coverPictureUrl ?? avatarUrl;
  const socialImageAlt = `${displayName}'s profile image`;
  const isIndexable = status !== 'not-found';

  useEffect(() => {
    document.title = title;

    return () => {
      document.title = '3bio';
    };
  }, [title]);

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
            ...(agentInteractionStatistic
              ? { agentInteractionStatistic }
              : {}),
          },
        }
      : undefined;

  return (
    <>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={
          isIndexable
            ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
            : 'noindex, nofollow'
        }
      />

      {isIndexable && (
        <>
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:type" content="profile" />
          <meta property="og:site_name" content="3bio" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="profile:username" content={normalizedHandle} />
          <meta
            name="twitter:card"
            content={coverPictureUrl ? 'summary_large_image' : 'summary'}
          />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />

          {socialImageUrl && (
            <>
              <meta property="og:image" content={socialImageUrl} />
              <meta property="og:image:alt" content={socialImageAlt} />
              <meta name="twitter:image" content={socialImageUrl} />
              <meta name="twitter:image:alt" content={socialImageAlt} />
            </>
          )}

          {structuredData && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData).replace(
                  /</g,
                  '\\u003c',
                ),
              }}
            />
          )}
        </>
      )}
    </>
  );
};
