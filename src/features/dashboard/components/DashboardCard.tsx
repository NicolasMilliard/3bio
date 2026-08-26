import type { ReactNode } from 'react';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Text,
} from '@/components/ui';
import { cn } from '@/lib/utils';

type DashboardCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  description,
  icon,
  footer,
  children,
  className,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        'border-border/70 bg-card gap-0 border py-0 ring-0',
        className,
      )}
    >
      <CardHeader className="border-border/70 bg-secondary/55 relative overflow-hidden border-b p-6 sm:p-7">
        <div
          aria-hidden="true"
          className="bg-accent/35 pointer-events-none absolute -top-12 -right-10 size-32 rounded-full blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          {icon ? (
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
              {icon}
            </div>
          ) : null}
          <div className="space-y-1.5">
            <CardTitle>
              <Text variant="h2" className="text-foreground text-2xl font-bold">
                {title}
              </Text>
            </CardTitle>
            {description && (
              <CardDescription className="text-foreground/75 leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      {children ? <div className="relative p-6">{children}</div> : null}

      {footer && (
        <CardFooter
          className={cn(
            'relative mt-auto flex justify-end p-6',
            children && 'pt-0',
          )}
        >
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
