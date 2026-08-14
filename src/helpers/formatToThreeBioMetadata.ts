import { type Account } from '@lens-protocol/react';
import {
  hasThreeBioMetadataTombstone,
  parseThreeBioMetadataAttributes,
} from './parseThreeBioMetadata';

export const formatToThreeBioMetadata = (account: Account) => {
  const metadata = account.metadata;
  const attributes = metadata?.attributes;

  const threeBioMetadata = parseThreeBioMetadataAttributes(attributes);

  const threeBioProfile = threeBioMetadata?.profile;
  const threeBioTheme = threeBioMetadata?.theme;
  const threeBioSettings = threeBioMetadata?.settings;
  const hasTombstone = (
    path: Parameters<typeof hasThreeBioMetadataTombstone>[1],
  ) => hasThreeBioMetadataTombstone(threeBioMetadata, path);

  const profile = {
    coverPicture: hasTombstone('profile.coverPicture')
      ? undefined
      : (threeBioProfile?.coverPicture ?? metadata?.coverPicture),
    linksPanelBackground: hasTombstone('profile.linksPanelBackground')
      ? undefined
      : threeBioProfile?.linksPanelBackground,
    avatar: hasTombstone('profile.avatar')
      ? undefined
      : (threeBioProfile?.avatar ?? metadata?.picture),
    name: hasTombstone('profile.name')
      ? null
      : (threeBioProfile?.name ?? metadata?.name),
    bio: hasTombstone('profile.bio')
      ? null
      : (threeBioProfile?.bio ?? metadata?.bio),
    socialLinks: hasTombstone('profile.socialLinks')
      ? undefined
      : threeBioProfile?.socialLinks,
    links: hasTombstone('profile.links') ? undefined : threeBioProfile?.links,
  };

  return {
    profile,
    theme: threeBioTheme,
    settings: threeBioSettings,
  };
};
