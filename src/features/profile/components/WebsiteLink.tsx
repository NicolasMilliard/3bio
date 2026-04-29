import { getHostname } from '@/helpers';
import { useState } from 'react';

import { ExternalLink } from 'lucide-react';

type WebsiteLinkProps = {
  href?: string;
  label: string;
  onClick?: () => void;
};

export const WebsiteLink = ({ href, label, onClick }: WebsiteLinkProps) => {
  const isInteractiveButton = !!onClick;

  const hostname = getHostname(href);

  const [imgSrc, setImgSrc] = useState<string | null>(
    hostname ? `https://${hostname}/favicon.ico` : null,
  );

  const googleFallback = hostname
    ? `https://www.google.com/s2/favicons?domain=${hostname}`
    : null;

  const content = (
    <>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={label}
          className="h-5 w-5 shrink-0 rounded-sm object-cover"
          onError={() => {
            if (imgSrc !== googleFallback) {
              setImgSrc(googleFallback);
            } else {
              setImgSrc(null);
            }
          }}
        />
      ) : (
        <span className="text-[1.1rem] leading-none">🔗</span>
      )}

      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {label}
      </span>

      <ExternalLink className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </>
  );

  const className =
    'group border-border bg-background flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-[0.9375rem] font-semibold no-underline shadow-[0_1px_12px_rgba(0,0,0,0.10),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 hover:-translate-y-px hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:translate-y-0';

  return (
    <div className="mb-5 flex w-full max-w-prose animate-[fadeUp_0.4s_ease_0.25s_both] flex-col gap-4">
      {isInteractiveButton ? (
        <button type="button" onClick={onClick} className={className}>
          {content}
        </button>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </a>
      )}
    </div>
  );
};
