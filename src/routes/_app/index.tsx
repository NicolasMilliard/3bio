import { createFileRoute } from '@tanstack/react-router';

import {
  AnalyticsSection,
  HeroSection,
  PricingSection,
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
      <div>
        <AnalyticsSection />
        <PricingSection />
      </div>
    </>
  );
}
