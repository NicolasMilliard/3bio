import { type PlatformName, SOCIAL_MAP } from '@/constants';
import { formatSocialLink } from '@/helpers';
import type { LensLink } from '@/schemas/threeBioMetadata.schema';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';

export const SocialLinks = ({ socialLinks }: { socialLinks?: LensLink[] }) => {
  if (!socialLinks || socialLinks.length === 0) return null;

  return (
    <div className="-ml-2 flex min-h-10 w-full max-w-prose flex-wrap items-center">
      {socialLinks.map((socialLink) => {
        const formattedSocialLink = formatSocialLink(socialLink);
        const platform = formattedSocialLink.platform
          ? SOCIAL_MAP[formattedSocialLink.platform as PlatformName]
          : null;

        if (!platform) return null;

        return (
          <Tooltip key={socialLink.key}>
            <TooltipTrigger asChild>
              <a
                href={socialLink.value}
                target="_blank"
                rel="ugc noopener noreferrer"
                className="text-icons hover:text-icons/60 focus-visible:ring-icons flex size-10 animate-[blurFadeIn_0.4s_ease-out_0.60s_both] items-center justify-center rounded-full transition motion-reduce:animate-none focus-visible:ring-2 focus-visible:outline-none"
                aria-label={platform.label}
              >
                <platform.Icon className="size-6" />
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
