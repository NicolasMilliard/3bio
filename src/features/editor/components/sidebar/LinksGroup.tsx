import { SidebarGroup, SidebarGroupLabel, Text } from '@/components/ui';
import { SocialLinks } from './form';

export const LinksGroup = () => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="pl-0 tracking-widest uppercase">
        Links
      </SidebarGroupLabel>
      <SocialLinks />
      <Text>Buttons</Text>
    </SidebarGroup>
  );
};
