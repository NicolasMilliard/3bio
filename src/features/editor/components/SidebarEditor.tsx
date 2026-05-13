import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  Text,
} from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import {
  AppearanceGroup,
  DisplayGroup,
  IdentityGroup,
  PresenceGroup,
} from './sidebar';

export const SidebarEditor = () => {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="text-foreground/70 border-foreground/40 items-start border-b">
        <Link
          to="/dashboard"
          className="hover:text-foreground flex items-center gap-1 text-sm hover:underline"
        >
          <ChevronLeft size={14} />
          Back to dashboard
        </Link>
        <Text variant="h3" className="text-foreground font-semibold">
          Profile editor
        </Text>
      </SidebarHeader>
      <SidebarContent>
        <IdentityGroup />
        <PresenceGroup />
        <AppearanceGroup />
        <DisplayGroup />
      </SidebarContent>
      <SidebarFooter className="border-foreground/40 border-t py-3">
        <Button type="submit">Save Changes</Button>
      </SidebarFooter>
    </Sidebar>
  );
};
