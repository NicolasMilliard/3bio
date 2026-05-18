import { cn } from '@/lib/utils';
import type { InBioTheme } from '@/schemas/inBioMetadata.schema';

export const ProfileSection = ({
  children,
  dataTheme,
}: {
  children: React.ReactNode;
  dataTheme?: InBioTheme['name'];
}) => {
  return (
    <section
      id="profile-section"
      data-theme={dataTheme}
      className={cn(
        'relative z-2 mx-4 flex w-full flex-col items-center gap-6 px-6 pt-12 pb-10',
        // Card
        'bg-card/55 border-border my-8 min-h-0 w-full max-w-105 rounded-3xl border px-8 pt-10 pb-8 shadow-[0_8px_48px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-180',
        'animate-[blurFadeIn_0.4s_ease-out_forwards]',
      )}
    >
      {children}
    </section>
  );
};
