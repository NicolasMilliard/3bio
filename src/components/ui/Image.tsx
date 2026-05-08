import { cn } from '@/lib/utils';
import type { ImgHTMLAttributes } from 'react';
import { useState } from 'react';

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  showSkeleton?: boolean;
  skeletonClassName?: string;
};

export const Image = ({
  loading = 'lazy',
  decoding = 'async',
  showSkeleton = false,
  skeletonClassName = '',
  ...props
}: ImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {showSkeleton && !isLoaded && (
        <div
          className={cn(
            'bg-muted absolute inset-0 animate-pulse rounded-4xl',
            skeletonClassName,
          )}
        />
      )}
      <img
        loading={loading}
        decoding={decoding}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
};
