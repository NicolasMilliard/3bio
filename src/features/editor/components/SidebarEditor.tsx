import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { IdentityGroup, LinksGroup, ThemeGroup } from './sidebar';

export const SidebarEditor = () => {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="text-foreground/70 border-foreground/40 items-start border-b">
        <Link
          to="/dashboard"
          className="hover:text-muted-foreground flex items-center gap-2 text-sm hover:underline"
        >
          <ChevronLeft size={16} />
          Back to dashboard
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <IdentityGroup />
        <LinksGroup />
        <ThemeGroup />
      </SidebarContent>
      <SidebarFooter>
        <Button type="submit">Save Changes</Button>
      </SidebarFooter>
    </Sidebar>
  );
};
