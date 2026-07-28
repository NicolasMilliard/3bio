import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';

import { Text } from '@/components/ui';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { SubscriptionCard } from './SubscriptionCard';

export const PricingSection = () => {
  const sectionRef = useRevealOnScroll<HTMLElement>('data-pricing-visible');

  return (
    <section
      ref={sectionRef}
      aria-labelledby="pricing-title"
      data-pricing-reveal
      className="bg-secondary py-30"
    >
      <div
        data-pricing-motion="content"
        className="mx-auto flex max-w-6xl flex-col items-center px-4"
      >
        <div
          data-pricing-motion="header"
          className="flex flex-col items-center"
        >
          <Text id="pricing-title" variant="h2" className="mb-6">
            Start with 3bio for free
          </Text>
          <Text className="max-w-122 text-center">
            Everything you need to turn your Lens profile into a personalized
            link&nbsp;in&nbsp;bio page. No subscription or payment required.
          </Text>
        </div>
        <div
          data-pricing-motion="card"
          className="mt-16 flex w-full justify-center"
        >
          {SUBSCRIPTION_PLANS.map((plan) => (
            <SubscriptionCard
              key={plan.variant}
              variant={plan.variant}
              price={{
                value: plan.price.value,
                subtitle: plan.price.subtitle,
                previousValue: plan.price.previousValue,
                additionalContent: plan.price.additionalContent,
              }}
              features={{
                title: plan.features.title,
                items: plan.features.items,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
