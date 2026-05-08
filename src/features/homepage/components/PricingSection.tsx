import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';

import { Text } from '@/components/ui';
import { SubscriptionCard } from './SubscriptionCard';

export const PricingSection = () => {
  return (
    <section className="bg-secondary pt-30">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4">
        <Text variant="h2" className="mb-6">
          Choose your right plan!
        </Text>
        <Text className="max-w-97">
          Simple pricing and powerful features, cancellation possible at any
          time. <br />
          Pay with crypto (GHO or USDC) or credit card.
        </Text>
        <div className="mt-16 flex gap-16">
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
