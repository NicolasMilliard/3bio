import { THREEBIO_ATTRIBUTE_KEY } from '@/constants';
import { threeBioMetadataSchema } from '@/schemas/threeBioMetadata.schema';
import { type Account } from '@lens-protocol/react';

function findAttribute<T extends string, V>(
  attributes: { key: string; value: unknown }[] | undefined,
  key: T,
): V | undefined {
  return attributes?.find((a) => a.key === key)?.value as V | undefined;
}

export const formatToThreeBioMetadata = (account: Account) => {
  const metadata = account.metadata;
  const attributes = metadata?.attributes;

  const rawThreeBioMetadata = findAttribute<
    typeof THREEBIO_ATTRIBUTE_KEY,
    unknown
  >(attributes, THREEBIO_ATTRIBUTE_KEY);
  let parsedThreeBioMetadata: unknown = rawThreeBioMetadata;

  if (typeof rawThreeBioMetadata === 'string') {
    try {
      parsedThreeBioMetadata = JSON.parse(rawThreeBioMetadata);
    } catch {
      parsedThreeBioMetadata = undefined;
    }
  }

  const parsedResult = threeBioMetadataSchema.safeParse(parsedThreeBioMetadata);
  const threeBioMetadata = parsedResult.success ? parsedResult.data : undefined;

  const threeBioProfile = threeBioMetadata?.profile;
  const threeBioTheme = threeBioMetadata?.theme;
  const threeBioSettings = threeBioMetadata?.settings;

  const profile = {
    coverPicture: threeBioProfile?.coverPicture ?? metadata?.coverPicture,
    avatar: threeBioProfile?.avatar ?? metadata?.picture,
    name: threeBioProfile?.name ?? metadata?.name,
    bio: threeBioProfile?.bio ?? metadata?.bio,
    socialLinks: threeBioProfile?.socialLinks,
    links: threeBioProfile?.links,
  };

  return {
    profile,
    theme: threeBioTheme,
    settings: threeBioSettings,
  };
};
