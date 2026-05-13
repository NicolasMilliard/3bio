import { SidebarGroup, SidebarGroupLabel } from '@/components/ui';
import { ButtonLinks, SocialLinks } from './form';

export const PresenceGroup = () => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="pl-0 tracking-wider">
        Presence
      </SidebarGroupLabel>
      <div className="flex flex-col gap-4">
        <SocialLinks />
        <ButtonLinks />
      </div>
    </SidebarGroup>
  );
};
