import type { SubscriptionPlan } from '../constants/subscriptionPlans';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Text,
} from '@/components/ui';
import { Link } from '@tanstack/react-router';

export const SubscriptionCard = ({
  variant,
  price,
  features,
}: SubscriptionPlan) => (
  <Card className="min-h-85 max-w-88 flex-1/2 py-0 shadow-none ring-0">
    <CardHeader
      className={`${variant === 'free' ? 'bg-muted' : 'bg-accent'} py-4`}
    >
      <CardTitle>
        <Text variant="h2" className="capitalize">
          {variant}
        </Text>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="mb-8">
        <div className="flex items-center gap-6">
          <Text variant="h2">{price.value}</Text>
          {price.previousValue && (
            <Text className="text-muted-foreground line-through">
              {price.previousValue}
            </Text>
          )}
          {price.additionalContent && <>{price.additionalContent}</>}
        </div>
        <Text className="text-muted-foreground">{price.subtitle}</Text>
      </div>
      <Text className="font-bold">{features.title}</Text>
      <ul>
        {features.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </CardContent>
    <CardFooter className="mx-auto pb-6">
      <Button asChild variant={variant === 'free' ? 'outline' : 'default'}>
        <Link to="/dashboard">Get started</Link>
      </Button>
    </CardFooter>
  </Card>
);
