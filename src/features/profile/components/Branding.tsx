import { cn } from '@/lib/utils';

export const Branding = ({ className }: { className?: string }) => {
  return (
    <p
      className={cn(
        'text-branding-text animate-[blurFadeIn_0.4s_ease-out_0.90s_both] text-sm leading-5 motion-reduce:animate-none',
        className,
      )}
    >
      Powered by{' '}
      <a
        href="https://3bio.social"
        className="text-branding-text focus-visible:ring-name-text rounded-sm font-medium underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:ring-2 focus-visible:outline-none"
        target="_blank"
        rel="noopener noreferrer"
      >
        3bio
      </a>{' '}
      · built on Lens
    </p>
  );
};
