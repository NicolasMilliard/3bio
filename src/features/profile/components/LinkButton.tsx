import { getHostname } from '@/helpers';
import { cn } from '@/lib/utils';
import { useState } from 'react';

import { Image } from '@/components/ui';
import { ExternalLink, Link2 } from 'lucide-react';

type LinkButtonProps = {
  href?: string;
  label: string;
  onClick?: () => void;
  className?: string;
};

export const LinkButton = ({
  href,
  label,
  onClick,
  className = '',
}: LinkButtonProps) => {
  const isButton = !!onClick;

  const hostname = getHostname(href);

  const [imgSrc, setImgSrc] = useState<string | null>(
    hostname ? `https://${hostname}/favicon.ico` : null,
  );

  const fallbackFavicon = hostname
    ? `https://www.google.com/s2/favicons?domain=${hostname}`
    : null;

  const handleImageError = () => {
    if (imgSrc && imgSrc !== fallbackFavicon) {
      setImgSrc(fallbackFavicon);
      return;
    }

    setImgSrc(null);
  };

  const Wrapper = isButton ? 'button' : 'a';

  const wrapperProps = isButton
    ? {
        type: 'button' as const,
        onClick,
      }
    : {
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
      };

  return (
    <div className={cn('w-full max-w-60', className)}>
      <Wrapper
        {...wrapperProps}
        className="group bg-links-background text-links-text hover:bg-links-background/90 focus-visible:ring-name-text flex w-full cursor-pointer items-center gap-2 rounded-2xl px-3 py-3 text-base font-normal transition-all duration-150 will-change-transform focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] active:shadow-inner"
      >
        <span className="bg-links-icon-background text-links-icon flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="size-3.5 rounded-sm"
              onError={handleImageError}
            />
          ) : (
            <Link2 aria-hidden="true" className="size-3.5" />
          )}
        </span>

        <span className="flex-1 truncate text-left" title={label}>
          {label}
        </span>

        <span className="bg-links-icon-background text-links-icon flex size-6 shrink-0 items-center justify-center rounded-full">
          <ExternalLink
            aria-hidden="true"
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </Wrapper>
    </div>
  );
};
