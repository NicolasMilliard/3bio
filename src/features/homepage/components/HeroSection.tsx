import { Text } from '@/components/ui';
import { INBIO_GITHUB_URL } from '@/constants';
import { ProfileCheckingForm } from './ProfileCheckingForm';

export const HeroSection = () => {
  return (
    <section className="bg-secondary relative -top-20 min-h-dvh pt-28 pb-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-16 px-4 md:flex-row">
        <div className="mx-auto flex flex-col gap-10 md:mx-0">
          <Text
            variant="h1"
            className="max-w-97 animate-[blurFadeIn_0.8s_ease-out_forwards]"
          >
            Finally, your decentralized link&nbsp;in&nbsp;bio.
          </Text>
          <Text className="max-w-97 animate-[blurFadeIn_0.8s_ease-out_0.15s_forwards] opacity-0">
            It's time to take back control of your digital identity. inBio is
            decentralized,{' '}
            <a
              href={INBIO_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              open source
            </a>
            , and your profile is already live.
          </Text>
          <ProfileCheckingForm />
        </div>
        {/* TODO: Add image instead of this placeholder */}
        <div className="bg-accent mx-auto h-172.5 w-80 animate-[blurFadeIn_0.8s_ease-out_0.45s_forwards] opacity-0 md:mx-0"></div>
      </div>
    </section>
  );
};
