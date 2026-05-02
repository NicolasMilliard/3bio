import { type PlatformName, SOCIAL_MAP } from '@/constants';
import { formatSocialLink } from '@/helpers';
import type { LensLink } from '@/schemas/inBioMetadata.schema';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';

export const SocialLinks = ({ socialLinks }: { socialLinks?: LensLink[] }) => {
  if (!socialLinks || socialLinks.length === 0) return null;

  return (
    <div className="flex max-w-prose flex-wrap items-center justify-center gap-3">
      {socialLinks.map((socialLink) => {
        const formattedSocialLink = formatSocialLink(socialLink);
        const platform = formattedSocialLink.platform
          ? SOCIAL_MAP[formattedSocialLink.platform as PlatformName]
          : null;

        if (!platform) return null;

        return (
          <Tooltip>
            <TooltipTrigger>
              <a
                key={socialLink.key}
                href={socialLink.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-chart-2 transition"
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
