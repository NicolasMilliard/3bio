import { getHostname } from '@/helpers';
import { cn } from '@/lib/utils';
import {
  forwardRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type Ref,
} from 'react';

import { Image } from '@/components/ui';
import { ExternalLink, Link2 } from 'lucide-react';

type LinkButtonBaseProps = {
  href?: string;
  label: string;
  className?: string;
  interactive?: boolean;
  loadFavicon?: boolean;
};

type LinkButtonProps = LinkButtonBaseProps &
  (
    | ({ as: 'button' } & Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        'children' | 'className' | 'type'
      >)
    | ({ as?: 'link' } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        'children' | 'className' | 'href'
      >)
  );

export const LinkButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  LinkButtonProps
>(function LinkButton(
  {
    href,
    label,
    className = '',
    interactive = true,
    loadFavicon = true,
    as = 'link',
    ...elementProps
  },
  ref,
) {
  const hostname = getHostname(href);
  const primaryFavicon =
    loadFavicon && hostname ? `https://${hostname}/favicon.ico` : null;
  const [favicon, setFavicon] = useState({
    hostname,
    src: primaryFavicon,
  });
  const imgSrc = favicon.hostname === hostname ? favicon.src : primaryFavicon;

  const fallbackFavicon =
    loadFavicon && hostname
      ? `https://www.google.com/s2/favicons?domain=${hostname}`
      : null;

  const handleImageError = () => {
    if (imgSrc && imgSrc !== fallbackFavicon) {
      setFavicon({ hostname, src: fallbackFavicon });
      return;
    }

    setFavicon({ hostname, src: null });
  };

  const content = (
    <>
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
    </>
  );

  return (
    <div className={cn('w-full max-w-60', className)}>
      {!interactive ? (
        <div className="group bg-links-background text-links-text flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-base font-normal">
          {content}
        </div>
      ) : as === 'button' ? (
        <button
          {...(elementProps as ButtonHTMLAttributes<HTMLButtonElement>)}
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          className="group bg-links-background text-links-text hover:bg-links-background/90 focus-visible:ring-links-text flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-base font-normal transition-all duration-150 will-change-transform focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] active:shadow-inner"
        >
          {content}
        </button>
      ) : (
        <a
          {...(elementProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="ugc noopener noreferrer"
          className="group bg-links-background text-links-text hover:bg-links-background/90 focus-visible:ring-links-text flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-base font-normal transition-all duration-150 will-change-transform focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] active:shadow-inner"
        >
          {content}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
});
