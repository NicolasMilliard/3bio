import { Button, Text } from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Palette, Settings } from 'lucide-react';
import { BannerInput, StatisticsToggle } from './index';
import { BrandingSwitch } from './sidebar/BrandingSwitch';

const sections = [
  {
    label: 'Theme',
    icon: Palette,
  },
];

export const SidebarEditor = () => {
  return (
    <aside className="border-background/15 bg-background/50 ring-muted fixed inset-y-4 left-4 z-10 flex w-72 flex-col rounded-4xl border p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 backdrop-blur-2xl backdrop-saturate-150">
      <Link to="/dashboard" className="flex items-center gap-2">
        <ArrowLeft className="text-muted size-4" />
        <Text className="text-muted text-sm">Go back to dashboard</Text>
      </Link>

      <div className="border-foreground border-b py-4">
        <div className="mb-1 flex items-center gap-2">
          <Settings className="text-foreground size-4" />
          <Text className="text-foreground font-medium tracking-wide uppercase">
            Editor
          </Text>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto p-3">
        <BannerInput />
        <StatisticsToggle />
        <BrandingSwitch />

        {sections.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Icon className="size-4 text-neutral-500" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <Button type="submit">Save Changes</Button>
    </aside>
  );
};
