import { THREEBIO_ATTRIBUTE_KEY } from '@/constants';
import { type Account } from '@lens-protocol/react';
import { parseThreeBioMetadata } from './parseThreeBioMetadata';

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
  const threeBioMetadata = parseThreeBioMetadata(rawThreeBioMetadata);

  const threeBioProfile = threeBioMetadata?.profile;
  const threeBioTheme = threeBioMetadata?.theme;
  const threeBioSettings = threeBioMetadata?.settings;

  const profile = {
    coverPicture: threeBioProfile?.coverPicture ?? metadata?.coverPicture,
    linksPanelBackground: threeBioProfile?.linksPanelBackground,
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
