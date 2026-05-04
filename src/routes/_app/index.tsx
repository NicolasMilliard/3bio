import { createFileRoute } from '@tanstack/react-router';

import {
  HeroSection,
  SocialProofSection,
} from '@/features/homepage/components';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <HeroSection />
      <SocialProofSection />
    </>
  );
}
