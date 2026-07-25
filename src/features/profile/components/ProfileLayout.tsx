import {
  THREE_BIO_DEFAULT_THEME,
  type PlatformName,
  type ThreeBioThemeName,
} from '@/constants';
import type {
  LensLink,
  ThreeBioProfile,
} from '@/schemas/threeBioMetadata.schema';
import { useRef, type WheelEvent } from 'react';

import { Branding } from './Branding';
import { Identity } from './Identity';
import { Links } from './Links';
import { SocialLinks } from './SocialLinks';
import { Statistics } from './Statistics';

type ProfileLink = Pick<LensLink, 'key' | 'value'>;
type ProfileSocialLink = ProfileLink & { platform?: PlatformName };

export type ProfileViewModel = Pick<
  ThreeBioProfile,
  'avatar' | 'name' | 'bio'
> & {
  socialLinks?: ProfileSocialLink[];
  links?: ProfileLink[];
};

export type ProfileStatistics = {
  followers?: number;
  following?: number;
  posts?: number;
};

type ProfileLayoutProps = {
  lensHandle: string;
  profile: ProfileViewModel;
  statistics?: ProfileStatistics;
  themeName?: ThreeBioThemeName;
  displayStatistics?: boolean;
  displayBranding?: boolean;
  mode?: 'public' | 'preview';
  as?: 'div' | 'main';
};

export const ProfileLayout = ({
  lensHandle,
  profile,
  statistics,
  themeName = THREE_BIO_DEFAULT_THEME,
  displayStatistics = true,
  displayBranding = true,
  mode = 'public',
  as: Root = 'div',
}: ProfileLayoutProps) => {
  const contentPanelRef = useRef<HTMLElement>(null);
  const isInteractive = mode === 'public';

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    const contentPanel = contentPanelRef.current;

    if (
      !contentPanel ||
      contentPanel.contains(event.target as Node) ||
      contentPanel.scrollHeight <= contentPanel.clientHeight ||
      event.deltaY === 0
    ) {
      return;
    }

    contentPanel.scrollBy({ top: event.deltaY });
  };

  return (
    <Root
      data-theme={themeName}
      className="profile-viewport bg-background min-h-dvh w-full min-w-0"
      onWheel={handleWheel}
      role={mode === 'preview' ? 'region' : undefined}
      aria-label={mode === 'preview' ? 'Profile preview' : undefined}
    >
      <div className="profile-page min-h-dvh">
        <div className="profile-layout mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-8 sm:px-8">
          <section
            aria-label="Profile summary"
            className="profile-summary flex min-w-0 flex-col gap-4"
          >
            <Identity lensHandle={lensHandle} profile={profile} />
            <SocialLinks
              socialLinks={profile.socialLinks}
              interactive={isInteractive}
            />
            {displayStatistics && <Statistics {...statistics} />}
          </section>

          <section
            ref={contentPanelRef}
            aria-label="Profile links"
            className="profile-links-panel profile-content-scroll bg-content-background min-h-48 w-full animate-[blurFadeIn_0.4s_ease-out_0.75s_backwards] rounded-4xl px-5 py-6 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:animate-none sm:px-8"
            tabIndex={profile.links?.length ? 0 : undefined}
          >
            <Links links={profile.links} interactive={isInteractive} />
          </section>

          {displayBranding && (
            <Branding
              interactive={isInteractive}
              className="profile-branding text-center"
            />
          )}
        </div>
      </div>
    </Root>
  );
};
