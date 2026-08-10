import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import {
  threeBioMetadataSchema,
  type ThreeBioMetadata,
} from '@/schemas/threeBioMetadata.schema';
import { toLinkAttributes, toSocialLinkAttributes } from './metadataAttributes';

type PersistedProfileFormValues = Pick<
  MetadataFormValues,
  | 'name'
  | 'bio'
  | 'socialLinks'
  | 'links'
  | 'theme'
  | 'displayStatistics'
  | 'displayBranding'
>;

export const buildPersistedThreeBioMetadata = ({
  current,
  values,
  avatarUri,
  coverPictureUri,
  linksPanelBackgroundUri,
}: {
  current: ThreeBioMetadata;
  values: PersistedProfileFormValues;
  avatarUri: string | null | undefined;
  coverPictureUri: string | null | undefined;
  linksPanelBackgroundUri: string | null | undefined;
}): ThreeBioMetadata =>
  threeBioMetadataSchema.parse({
    ...current,
    profile: {
      ...(avatarUri == null ? {} : { avatar: avatarUri }),
      ...(coverPictureUri == null ? {} : { coverPicture: coverPictureUri }),
      ...(linksPanelBackgroundUri == null
        ? {}
        : { linksPanelBackground: linksPanelBackgroundUri }),
      ...(values.name === undefined ? {} : { name: values.name }),
      ...(values.bio === undefined ? {} : { bio: values.bio }),
      socialLinks: toSocialLinkAttributes(values.socialLinks),
      links: toLinkAttributes(values.links),
    },
    theme: {
      name: values.theme,
      displayStatistics: values.displayStatistics ?? true,
      displayBranding: values.displayBranding ?? true,
    },
  });
