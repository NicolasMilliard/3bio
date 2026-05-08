import { Badge } from '@/components/ui';

export type SubscriptionPlan = {
  variant: 'free' | 'premium';
  price: {
    value: string;
    subtitle: string;
    previousValue?: string;
    additionalContent?: React.ReactNode;
  };
  features: {
    title: string;
    items: string[];
  };
};

export const SUBSCRIPTION_PLANS: Array<SubscriptionPlan> = [
  {
    variant: 'free',
    price: {
      value: '$0',
      subtitle: 'Free, forever',
    },
    features: {
      title: 'Key features:',
      items: [
        'Unlimited links',
        'Unlimited social icons',
        'SEO optimized, high-converting design',
      ],
    },
  },
  {
    variant: 'premium',
    price: {
      value: '$3/mo',
      subtitle: 'Billed monthly',
      previousValue: '$5/mo',
      additionalContent: (
        <Badge
          variant="outline"
          className="text-primary bg-accent/15 border-2 p-4"
        >
          Launch offer!
        </Badge>
      ),
    },
    features: {
      title: 'Everything in Free, plus:',
      items: [
        'Custom avatar and background images',
        'Custom themes',
        'NFTs gallery',
        'Complete analytics',
      ],
    },
  },
];
