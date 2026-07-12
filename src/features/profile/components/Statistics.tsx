import { formatCount } from '@/helpers';
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
    <dl className="bg-statistics-background flex w-full max-w-97 animate-[blurFadeIn_0.45s_ease-out_0.45s_both] items-center rounded-2xl px-5 py-5 motion-reduce:animate-none">
      {[
        { value: following, label: 'Following' },
        { value: followers, label: 'Followers' },
        { value: posts, label: 'Posts' },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <dt className="text-statistics-title text-sm leading-5 font-normal uppercase sm:text-base">
            {label}
          </dt>
          <dd className="text-statistics-number text-base leading-5 font-medium tracking-tight">
            {value !== undefined ? formatCount(value) : '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
};
