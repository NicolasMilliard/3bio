import { createFileRoute } from '@tanstack/react-router';

import {
  CreatorRightsSection,
  HeroSection,
  PricingSection,
} from '@/features/homepage/components';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <HeroSection />
      <CreatorRightsSection />
      <PricingSection />
    </>
  );
}
