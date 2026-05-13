import { Text } from '@/components/ui';
import { AddSocialIconLink, EditableSocialLinks } from './social-links';

export const SocialLinks = () => {
  return (
    <div className="flex flex-col gap-2">
      <Text className="text-sidebar-foreground/70">Social icons</Text>
      <div className="flex flex-wrap gap-2">
        <EditableSocialLinks />
        <AddSocialIconLink />
      </div>
    </div>
  );
};
