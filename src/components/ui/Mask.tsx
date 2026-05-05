import { cn } from '@/lib/utils';

type Orientation = 'landscape' | 'portrait';

export type Shape =
  | { type: 'circle' }
  | { type: 'oval'; orientation?: Orientation }
  | { type: 'rect'; orientation?: Orientation }
  | { type: 'custom'; orientation?: Orientation };

type MaskProps = {
  shape?: Shape;
  className?: string;
  children: React.ReactNode;
};

export const Mask = ({
  shape = { type: 'rect' },
  className,
  children,
}: MaskProps) => {
  const shapeClass = getShapeClass(shape);

  return (
    <div className={cn('overflow-hidden', shapeClass, className)}>
      {children}
    </div>
  );
};

function getOrientationClassName(orientation?: Orientation): string {
  const formattedOrientation = orientation ?? 'landscape';
  return formattedOrientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-[3/4]';
}

function getShapeClass(shape: Shape): string {
  switch (shape.type) {
    case 'circle':
      return 'rounded-full aspect-square';

    case 'oval':
      return cn('rounded-full', getOrientationClassName(shape.orientation));

    case 'rect':
      return getOrientationClassName(shape.orientation);

    case 'custom':
      return getOrientationClassName(shape.orientation);
  }
}
