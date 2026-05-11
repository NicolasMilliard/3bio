import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import {
  IdentityGroup,
  LinksGroup,
  StatisticsGroup,
  ThemeGroup,
} from './sidebar';

export const SidebarEditor = () => {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="text-foreground/70 border-foreground/40 items-start border-b">
        <Button asChild type="button" variant="ghost" className="text-sm">
          <Link to="/dashboard">
            <ChevronLeft size={16} />
            Back to dashboard
          </Link>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <IdentityGroup />
        <LinksGroup />
        <StatisticsGroup />
        <ThemeGroup />
      </SidebarContent>
      <SidebarFooter>
        <Button type="submit">Save Changes</Button>
      </SidebarFooter>
    </Sidebar>
  );
};
