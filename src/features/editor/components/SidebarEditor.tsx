import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  Text,
} from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { BannerInput } from './BannerInput';
import { StatisticsToggle } from './StatisticsToggle';
import { BrandingSwitch } from './sidebar/BrandingSwitch';

export const SidebarEditor = () => {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="text-foreground/70 border-foreground/40 items-start border-b">
        <Button asChild type="button" variant="ghost" className="text-sm">
          <Link to="/dashboard">
            <ArrowLeft size={16} />
            Return to dashboard
          </Link>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-widest uppercase">
            Identity
          </SidebarGroupLabel>
          <Text>Name</Text>
          <Text>Bio</Text>
          <Text>Avatar</Text>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-widest uppercase">
            Links
          </SidebarGroupLabel>
          <Text>Social links</Text>
          <Text>Buttons</Text>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-widest uppercase">
            Statistics
          </SidebarGroupLabel>
          <StatisticsToggle />
          <Text>Display followers number</Text>
          <Text>Display following number</Text>
          <Text>Display posts number</Text>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-widest uppercase">
            Theme
          </SidebarGroupLabel>
          <BannerInput />
          <BrandingSwitch />
          <Text>Preset</Text>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button type="submit">Save Changes</Button>
      </SidebarFooter>
    </Sidebar>
  );
};
