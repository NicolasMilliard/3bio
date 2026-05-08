import { cn } from '@/lib/utils';

export const InBioLogo = ({ isAtTop = false }: { isAtTop?: boolean }) => {
  return (
    <span
      className={cn(
        'bg-accent text-primary flex h-20 items-center justify-center px-3.5 py-7 text-3xl font-extrabold',
        isAtTop ? 'rounded-b-lg' : 'rounded-lg',
      )}
    >
      inBio
    </span>
  );
};
