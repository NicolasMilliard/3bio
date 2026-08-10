import {
  SOCIAL_MAP,
  THREE_BIO_DEFAULT_THEME,
  type PlatformName,
} from '@/constants';
import { useFormContext, useWatch } from 'react-hook-form';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

import {
  ProfileLayout,
  type ProfileStatistics,
  type ProfileViewModel,
} from '@/features/profile/components';

export const EditorProfilePreview = ({
  lensHandle,
  statistics,
}: {
  lensHandle: string;
  statistics?: ProfileStatistics;
}) => {
  const { control } = useFormContext<MetadataFormValues>();
  const [
    avatar,
    name,
    bio,
    socialLinks,
    links,
    theme,
    displayStatistics,
    displayBranding,
    linksPanelBackground,
  ] = useWatch({
    control,
    name: [
      'avatar',
      'name',
      'bio',
      'socialLinks',
      'links',
      'theme',
      'displayStatistics',
      'displayBranding',
      'linksPanelBackground',
    ],
  });

  const profile = {
    avatar: avatar?.preview || undefined,
    linksPanelBackground: linksPanelBackground?.preview || undefined,
    name,
    bio,
    socialLinks: (socialLinks ?? []).flatMap(({ platform, url }) => {
      const value = url?.trim();
      const platformName = platform as PlatformName;

      return value && platformName in SOCIAL_MAP
        ? [
            {
              key: `editor-social-${platformName}`,
              platform: platformName,
              value,
            },
          ]
        : [];
    }),
    links: (links ?? []).flatMap((url, index) => {
      const value = url.trim();

      return value ? [{ key: `editor-link-${index}`, value }] : [];
    }),
  } satisfies ProfileViewModel;

  return (
    <ProfileLayout
      lensHandle={lensHandle}
      profile={profile}
      statistics={statistics}
      themeName={theme ?? THREE_BIO_DEFAULT_THEME}
      displayStatistics={displayStatistics ?? true}
      displayBranding={displayBranding ?? true}
      mode="preview"
    />
  );
};
