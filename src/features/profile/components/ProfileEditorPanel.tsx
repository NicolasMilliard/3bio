import { AuthButton } from '@/features/auth/components';
import { BarChart3, Image, Link2, Palette, Settings } from 'lucide-react';

const sections = [
  {
    label: 'Banner',
    icon: Image,
  },
  {
    label: 'CTA Links',
    icon: Link2,
  },
  {
    label: 'Statistics',
    icon: BarChart3,
  },
  {
    label: 'Theme',
    icon: Palette,
  },
];

export const ProfileEditorPanel = () => {
  return (
    <aside className="sticky top-0 flex h-dvh w-72 flex-col border-l bg-white">
      <div className="border-b px-5 py-4">
        <div className="mb-1 flex items-center gap-2">
          <Settings className="size-4 text-neutral-500" />
          <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
            Editor
          </span>
        </div>

        <h2 className="text-lg font-semibold text-neutral-900">Edit Profile</h2>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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

      <div className="border-t p-4">
        <AuthButton />
      </div>
    </aside>
  );
};
