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
  onError,
  onLoad,
  src,
  ...props
}: ImageProps) => {
  const [settledSrc, setSettledSrc] = useState<string | undefined>();
  const isSettled = settledSrc === src;

  return (
    <div className="relative overflow-hidden">
      {showSkeleton && !isSettled && (
        <div
          className={cn(
            'bg-muted absolute inset-0 animate-pulse rounded-lg',
            skeletonClassName,
          )}
        />
      )}
      <img
        {...props}
        src={src}
        loading={loading}
        decoding={decoding}
        onLoad={(event) => {
          setSettledSrc(src);
          onLoad?.(event);
        }}
        onError={(event) => {
          setSettledSrc(src);
          onError?.(event);
        }}
      />
    </div>
  );
};
