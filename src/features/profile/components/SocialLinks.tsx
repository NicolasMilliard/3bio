import { type PlatformName, SOCIAL_MAP } from '@/constants';
import { formatSocialLink } from '@/helpers';
import type { LensLink } from '@/schemas/threeBioMetadata.schema';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';

export const SocialLinks = ({
  socialLinks,
  interactive = true,
}: {
  socialLinks?: (Pick<LensLink, 'key' | 'value'> & {
    platform?: PlatformName;
  })[];
  interactive?: boolean;
}) => {
  if (!socialLinks || socialLinks.length === 0) return null;

  return (
    <div className="-ml-2 flex min-h-10 w-full max-w-prose flex-wrap items-center">
      {socialLinks.map((socialLink, index) => {
        const formattedSocialLink = formatSocialLink(socialLink);
        const platform = formattedSocialLink.platform
          ? SOCIAL_MAP[formattedSocialLink.platform]
          : null;

        if (!platform) return null;

        if (!interactive) {
          return (
            <span
              key={`${socialLink.key}-${index}`}
              className="text-icons flex size-10 animate-[blurFadeIn_0.4s_ease-out_0.60s_backwards] items-center justify-center rounded-md motion-reduce:animate-none"
              role="img"
              aria-label={platform.label}
            >
              <platform.Icon aria-hidden="true" className="size-6" />
            </span>
          );
        }

        return (
          <Tooltip key={`${socialLink.key}-${index}`}>
            <TooltipTrigger asChild>
              <a
                href={socialLink.value}
                target="_blank"
                rel="ugc noopener noreferrer"
                className="text-icons hover:text-icons/60 focus-visible:ring-icons flex size-10 animate-[blurFadeIn_0.4s_ease-out_0.60s_backwards] items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none motion-reduce:animate-none"
                aria-label={`${platform.label} (opens in a new tab)`}
              >
                <platform.Icon aria-hidden="true" className="size-6" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{platform.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};
