import { formatCount } from '@/helpers';
import { Fragment } from 'react';

export const Statistics = ({
  followers,
  following,
  posts,
}: {
  followers?: number;
  following?: number;
  posts?: number;
}) => {
  return (
    <div className="bg-muted/50 flex w-full max-w-prose animate-[blurFadeIn_0.45s_ease-out_0.45s_both] items-center rounded-2xl px-5 py-3">
      {[
        { value: following, label: 'Following' },
        { value: followers, label: 'Followers' },
        { value: posts, label: 'Posts' },
      ].map(({ value, label }, i) => (
        <Fragment key={label}>
          {i > 0 && <div className="bg-border h-7 w-px shrink-0" />}
          <div className="flex flex-1 flex-col items-center gap-0.5">
            <span className="text-primary text-base leading-none font-bold tracking-tight">
              {value !== undefined ? formatCount(value) : '—'}
            </span>
            <span className="text-foreground text-[10px] font-medium tracking-wider uppercase sm:text-[12px]">
              {label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
};
