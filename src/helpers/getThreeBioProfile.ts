import {
  hasThreeBioMetadataTombstone,
  parseThreeBioMetadataAttributes,
} from './parseThreeBioMetadata';

export const getThreeBioProfile = (
  attributes: { key: string; value: unknown }[] | undefined,
) => {
  const threeBioMetadata = parseThreeBioMetadataAttributes(attributes);

  if (!threeBioMetadata) return undefined;

  const profile = threeBioMetadata.profile;
  const hasTombstone = (
    path: Parameters<typeof hasThreeBioMetadataTombstone>[1],
  ) => hasThreeBioMetadataTombstone(threeBioMetadata, path);

  if (
    !profile &&
    !threeBioMetadata.tombstones?.some((path) => path.startsWith('profile.'))
  ) {
    return undefined;
  }

  return {
    ...profile,
    ...(hasTombstone('profile.avatar') ? { avatar: undefined } : {}),
    ...(hasTombstone('profile.coverPicture')
      ? { coverPicture: undefined }
      : {}),
    ...(hasTombstone('profile.linksPanelBackground')
      ? { linksPanelBackground: undefined }
      : {}),
    ...(hasTombstone('profile.name') ? { name: null } : {}),
    ...(hasTombstone('profile.bio') ? { bio: null } : {}),
    ...(hasTombstone('profile.socialLinks') ? { socialLinks: undefined } : {}),
    ...(hasTombstone('profile.links') ? { links: undefined } : {}),
  };
};
