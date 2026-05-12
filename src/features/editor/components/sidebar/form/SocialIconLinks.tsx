import { Text } from '@/components/ui';
import { EditableSocialLinks } from './social-links';

import { AddSocialIconLink } from './social-links/AddSocialIconLink';

export const SocialLinks = () => {
  return (
    <div className="flex flex-col gap-2">
      <Text className="text-muted-foreground">Social links</Text>
      <div className="flex flex-wrap gap-2">
        <EditableSocialLinks />
        <AddSocialIconLink />
      </div>
    </div>
  );
};
