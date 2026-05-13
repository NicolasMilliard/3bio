import { SidebarGroup, SidebarGroupLabel } from '@/components/ui';
import { BrandingSwitch, StatisticsSwitch } from './form';

export const DisplayGroup = () => (
  <SidebarGroup>
    <SidebarGroupLabel className="pl-0 tracking-wider">
      Display
    </SidebarGroupLabel>
    <div className="flex flex-col gap-4">
      <StatisticsSwitch />
      <BrandingSwitch />
    </div>
  </SidebarGroup>
);
