import { formatUrlLabel } from '@/helpers';
import type { LensLink } from '@/schemas/threeBioMetadata.schema';

import { LinkButton } from '@/features/profile/components';

export const Links = ({ links }: { links?: LensLink[] }) => {
  if (!links || links.length === 0) return null;

  return (
    <nav
      aria-label="External links"
      className="flex w-full animate-[blurFadeIn_0.4s_ease-out_0.75s_both] flex-col gap-6 motion-reduce:animate-none"
    >
      {links.map((link) => (
        <LinkButton
          key={link.key}
          href={link.value}
          label={formatUrlLabel(link.value)}
        />
      ))}
    </nav>
  );
};
