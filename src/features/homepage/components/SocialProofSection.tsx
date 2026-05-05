import { Text } from '@/components/ui';
import { CarouselCreators } from './CarouselCreators';

const WORDS = [
  'creator',
  'streamer',
  'vlogger',
  'influencer',
  'musician',
  'podcaster',
];

export const SocialProofSection = () => {
  return (
    <section className="mx-auto mb-16 max-w-6xl">
      <Text variant="h2" className="mb-16">
        Your favorite {/* Accessible static label */}
        <span className="sr-only">{WORDS[0]}</span>
        {/* Animation hidden from screen readers */}
        <span
          className="social-proof-rotator inline-block h-14 overflow-visible"
          aria-hidden="true"
        >
          <span className="social-proof-word-list inline-flex flex-col">
            {[...WORDS, WORDS[0]].map((word, i) => (
              <span key={i} className="h-14 leading-[1.9]">
                {word}
              </span>
            ))}
          </span>
        </span>
        <br />
        is already on inBio.
      </Text>
      <CarouselCreators />
    </section>
  );
};
