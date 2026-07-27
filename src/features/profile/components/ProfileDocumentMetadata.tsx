import { THREE_BIO_ORIGIN } from '@/constants';
import { useClearServerMetadata } from '@/hooks/useClearServerMetadata';
import type { ThreeBioProfile } from '@/schemas/threeBioMetadata.schema';
import { useEffect } from 'react';
import {
  buildProfileDocumentMetadata,
  HOME_TITLE,
  type ProfileMetadataStatus,
} from '../documentMetadata';

type ProfileDocumentMetadataProps = {
  lensHandle: string;
  profile?: ThreeBioProfile;
  followers?: number;
  following?: number;
  posts?: number;
  displayStatistics?: boolean;
  status: ProfileMetadataStatus;
};

export const ProfileDocumentMetadata = ({
  lensHandle,
  profile,
  followers,
  following,
  posts,
  displayStatistics = true,
  status,
}: ProfileDocumentMetadataProps) => {
  const isResolved = status !== 'loading';

  useClearServerMetadata(isResolved);

  const metadata = buildProfileDocumentMetadata({
    origin: THREE_BIO_ORIGIN,
    lensHandle,
    profile,
    followers,
    following,
    posts,
    displayStatistics,
    status,
  });

  useEffect(() => {
    if (!isResolved) return;

    document.title = metadata.title;

    return () => {
      document.title = HOME_TITLE;
    };
  }, [isResolved, metadata.title]);

  if (!isResolved) return null;

  return (
    <>
      <meta name="description" content={metadata.description} />
      <meta name="robots" content={metadata.robots} />

      {metadata.isIndexable && (
        <>
          <link rel="canonical" href={metadata.canonicalUrl} />
          <meta property="og:type" content="profile" />
          <meta property="og:site_name" content="3bio" />
          <meta property="og:title" content={metadata.title} />
          <meta property="og:description" content={metadata.description} />
          <meta property="og:url" content={metadata.canonicalUrl} />
          <meta
            property="profile:username"
            content={metadata.normalizedHandle}
          />
          <meta name="twitter:card" content={metadata.twitterCard} />
          <meta name="twitter:title" content={metadata.title} />
          <meta name="twitter:description" content={metadata.description} />

          {metadata.socialImageUrl && metadata.socialImageAlt && (
            <>
              <meta property="og:image" content={metadata.socialImageUrl} />
              <meta
                property="og:image:secure_url"
                content={metadata.socialImageUrl}
              />
              <meta property="og:image:alt" content={metadata.socialImageAlt} />
              <meta name="twitter:image" content={metadata.socialImageUrl} />
              <meta
                name="twitter:image:alt"
                content={metadata.socialImageAlt}
              />
              {metadata.socialImageKind === 'default' && (
                <>
                  <meta property="og:image:type" content="image/png" />
                  <meta property="og:image:width" content="1200" />
                  <meta property="og:image:height" content="630" />
                </>
              )}
            </>
          )}

          {metadata.structuredData && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(metadata.structuredData).replace(
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
