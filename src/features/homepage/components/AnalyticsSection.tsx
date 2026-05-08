import { analyticsImages } from '@/assets/analytics';
import { Button, Image, Text } from '@/components/ui';
import { Link } from '@tanstack/react-router';

export const AnalyticsSection = () => {
  return (
    <section className="bg-primary p-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-16 lg:flex-row lg:items-start">
        <Image
          src={analyticsImages.mockedIllustration}
          alt="Analytics dashboard illustration"
          width={424}
          height={424}
          aria-hidden="true"
          showSkeleton={true}
        />
        <div className="flex max-w-122 flex-col gap-10">
          <Text variant="h2" className="text-primary-foreground">
            {' '}
            Study your audience and maintain their engagement
          </Text>
          <Text className="text-primary-foreground">
            Track your audience over timen, monitor revenue, and learn what's
            converting your audience.
          </Text>
          <Button asChild variant="secondary" className="w-fit">
            <Link to="/dashboard">Launch App</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
