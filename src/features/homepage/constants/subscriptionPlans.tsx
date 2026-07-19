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
        'Custom avatar, cover, and theme',
        'Shareable public Lens profile',
      ],
    },
  },
];
