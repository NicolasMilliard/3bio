import { THREEBIO_GITHUB_URL } from '@/constants';

import { Text } from '@/components/ui';
import { HeroVisual } from './HeroVisual';
import { ProfileCheckingForm } from './ProfileCheckingForm';

export const HeroSection = () => {
  return (
    <section
      aria-labelledby="home-hero-title"
      className="bg-secondary min-h-dvh overflow-hidden pt-28 pb-10 sm:pt-32 sm:pb-14"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] lg:gap-16">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-8 lg:mx-0">
          <p className="text-primary flex animate-[blurFadeIn_0.8s_ease-out_forwards] items-center gap-3 text-xs font-black tracking-[0.2em] uppercase motion-reduce:animate-none">
            <span className="bg-accent size-2.5 rounded-full" />
            Your profile, your space
          </p>
          <Text
            id="home-hero-title"
            variant="h1"
            className="isolate max-w-xl animate-[blurFadeIn_0.8s_ease-out_0.08s_forwards] text-[clamp(2.75rem,5.5vw,4.25rem)] leading-[0.98] tracking-[-0.055em] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
          >
            Finally, your{' '}
            <span className="after:bg-accent relative inline-block after:absolute after:bottom-[0.04em] after:left-0 after:-z-10 after:h-[0.16em] after:w-full after:rounded-full after:content-['']">
              decentralized
            </span>{' '}
            link&nbsp;in&nbsp;bio.
          </Text>
          <Text className="max-w-lg animate-[blurFadeIn_0.8s_ease-out_0.18s_forwards] text-base leading-7 opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 sm:text-lg">
            Turn your Lens profile into a link&nbsp;in&nbsp;bio page you can
            customize and share. 3bio is{' '}
            <a
              href={THREEBIO_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              open source
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            and built on Lens.
          </Text>
          <ProfileCheckingForm />
          <p className="text-muted-foreground -mt-4 text-sm leading-6">
            Early alpha&mdash;expect rough edges and please share feedback.
          </p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
};
