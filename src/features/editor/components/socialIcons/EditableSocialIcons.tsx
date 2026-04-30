import {
  SOCIAL_CONFIG,
  type SocialType,
} from '@/features/profile/model/social.config';
import { useFormContext, useWatch } from 'react-hook-form';
import type { SocialLink } from '../../schemas/profileForm.schema';

import { EditSocialIconLink } from './EditSocialIconLink';

export const EditableSocialIcons = () => {
  const { control } = useFormContext<{ socialLinks: SocialLink[] }>();
  const socialLinks = useWatch({ control, name: 'socialLinks' });
  const activeLinks = socialLinks.filter((l) => l.url.trim() !== '');

  if (activeLinks.length === 0) return null;

  return (
    <div className="flex max-w-prose flex-wrap items-center justify-center gap-3">
      {activeLinks.map((link) => {
        const config = SOCIAL_CONFIG[link.type as SocialType];

        if (!config) return null;

        return (
          <EditSocialIconLink
            key={link.type}
            icon={config.icon('size-6')}
            label={config.label}
            type={link.type}
          />
        );
      })}
    </div>
  );
};
