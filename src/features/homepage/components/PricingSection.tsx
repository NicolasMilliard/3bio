import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';

import { Text } from '@/components/ui';
import { SubscriptionCard } from './SubscriptionCard';

export const PricingSection = () => {
  return (
    <section className="bg-secondary pt-30 pb-30">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4">
        <Text variant="h2" className="mb-6">
          Start with 3bio for free
        </Text>
        <Text className="max-w-122 text-center">
          Everything you need to turn your Lens profile into a personalized
          link&nbsp;in&nbsp;bio page. No subscription or payment required.
        </Text>
        <div className="mt-16 flex w-full justify-center">
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
