import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-primary text-[32px] font-extrabold',
      h2: 'text-primary text-[32px] font-extrabold',
      h3: 'text-primary text-2xl font-bold',
      body: '',
    },
  },
  defaultVariants: { variant: 'body' },
});

const defaultTags = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
} as const;

type TextProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
  };

export const Text = ({
  className,
  variant,
  asChild = false,
  ...props
}: TextProps) => {
  const Comp = asChild ? Slot : defaultTags[variant ?? 'body'];

  return (
    <Comp className={cn(textVariants({ variant }), className)} {...props} />
  );
};
