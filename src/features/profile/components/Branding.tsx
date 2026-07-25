import { THREE_BIO_ORIGIN } from '@/constants';
import { cn } from '@/lib/utils';

export const Branding = ({
  className,
  interactive = true,
}: {
  className?: string;
  interactive?: boolean;
}) => {
  return (
    <p
      className={cn(
        'text-branding-text animate-[blurFadeIn_0.4s_ease-out_0.90s_backwards] text-sm leading-5 motion-reduce:animate-none',
        className,
      )}
    >
      Powered by{' '}
      {interactive ? (
        <a
          href={THREE_BIO_ORIGIN}
          className="text-branding-text focus-visible:ring-name-text rounded-sm font-medium underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:ring-2 focus-visible:outline-none"
          target="_blank"
          rel="noopener noreferrer"
        >
          3bio
        </a>
      ) : (
        <span className="text-branding-text font-medium underline decoration-1 underline-offset-2">
          3bio
        </span>
      )}{' '}
      · built on Lens
    </p>
  );
};
