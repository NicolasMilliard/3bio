import { cn } from '@/lib/utils';

type Shape =
  | 'circle'
  | 'rounded'
  | 'square'
  | 'oval'
  | { type: 'rounded-rect'; radius: number }
  | { type: 'custom'; className: string };

type MaskProps = {
  shape?: Shape;
  className?: string;
  children: React.ReactNode;
};

export const Mask = ({ shape = 'rounded', className, children }: MaskProps) => {
  const shapeClass = getShapeClass(shape);

  return (
    <div className={cn('overflow-hidden', shapeClass, className)}>
      {children}
    </div>
  );
};

function getShapeClass(shape: Shape): string {
  if (typeof shape === 'string') {
    switch (shape) {
      case 'circle':
        return 'rounded-full aspect-square';
      case 'square':
        return 'aspect-square';
      case 'oval':
        return 'rounded-full aspect-[4/3]';
      case 'rounded':
        return 'rounded-2xl';
    }
  }

  if (shape.type === 'rounded-rect') {
    return `rounded-[${shape.radius}px]`;
  }

  if (shape.type === 'custom') {
    return shape.className;
  }

  return '';
}
