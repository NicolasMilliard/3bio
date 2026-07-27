import { CircleAlert, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

import { Button } from './button';

type ErrorScreenProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
};

export const ErrorScreen = ({
  title = 'Something went wrong.',
  description = 'The page could not be loaded. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  children,
}: ErrorScreenProps) => {
  const headingId = useId();
  const descriptionId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main
      className="flex min-h-dvh flex-1 items-center justify-center px-6 py-12 text-center"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <div className="flex max-w-md flex-col items-center gap-4">
        <CircleAlert
          className="text-destructive size-10"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <div className="space-y-2" role="alert">
          <h1
            ref={headingRef}
            id={headingId}
            className="text-3xl outline-none"
            tabIndex={-1}
          >
            {title}
          </h1>
          <p id={descriptionId} className="text-muted-foreground text-balance">
            {description}
          </p>
        </div>
        {(onRetry || children) && (
          <div className="flex flex-wrap justify-center gap-2">
            {onRetry && (
              <Button type="button" onClick={onRetry}>
                <RefreshCw aria-hidden="true" />
                {retryLabel}
              </Button>
            )}
            {children}
          </div>
        )}
      </div>
    </main>
  );
};
