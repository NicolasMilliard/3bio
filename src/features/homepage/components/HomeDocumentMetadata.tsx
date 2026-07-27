import { THREE_BIO_ORIGIN } from '@/constants';
import {
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_DESCRIPTION,
  HOME_TITLE,
} from '@/features/profile/documentMetadata';
import { useClearServerMetadata } from '@/hooks/useClearServerMetadata';

export const HomeDocumentMetadata = () => {
  useClearServerMetadata();

  const canonicalUrl = `${THREE_BIO_ORIGIN}/`;
  const socialImageUrl = `${THREE_BIO_ORIGIN}${DEFAULT_SOCIAL_IMAGE_PATH}`;

  return (
    <>
      <title>{HOME_TITLE}</title>
      <meta name="description" content={HOME_DESCRIPTION} />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="3bio" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={HOME_TITLE} />
      <meta property="og:description" content={HOME_DESCRIPTION} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={socialImageUrl} />
      <meta property="og:image:secure_url" content={socialImageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={DEFAULT_SOCIAL_IMAGE_ALT} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={HOME_TITLE} />
      <meta name="twitter:description" content={HOME_DESCRIPTION} />
      <meta name="twitter:image" content={socialImageUrl} />
      <meta name="twitter:image:alt" content={DEFAULT_SOCIAL_IMAGE_ALT} />
    </>
  );
};
