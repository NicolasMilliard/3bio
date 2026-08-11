import { createFileRoute } from '@tanstack/react-router';

import {
  CreatorRightsSection,
  HeroSection,
  HomeDocumentMetadata,
  PricingSection,
} from '@/features/homepage/components';

export const Route = createFileRoute('/_site/')({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <HomeDocumentMetadata />
      <HeroSection />
      <CreatorRightsSection />
      <PricingSection />
    </>
  );
}
