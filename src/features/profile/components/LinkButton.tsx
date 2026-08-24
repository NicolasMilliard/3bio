import { cn } from '@/lib/utils';
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type Ref,
} from 'react';

import { ExternalLink, Link2 } from 'lucide-react';

type LinkButtonBaseProps = {
  href?: string;
  label: string;
  className?: string;
  interactive?: boolean;
  surface?: 'profile' | 'editor';
};

type LinkButtonProps = LinkButtonBaseProps &
  (
    | ({ as: 'button' } & Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        'children' | 'className' | 'type'
      >)
    | ({ as?: 'link' } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        'children' | 'className' | 'href'
      >)
  );

export const LinkButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  LinkButtonProps
>(function LinkButton(
  {
    href,
    label,
    className = '',
    interactive = true,
    surface = 'profile',
    as = 'link',
    ...elementProps
  },
  ref,
) {
  const isEditorSurface = surface === 'editor';
  const linkRadiusClassName = 'rounded-lg';
  const iconSurfaceClassName = 'bg-links-icon-background text-links-icon';
  const linkSurfaceClassName = isEditorSurface
    ? 'bg-input/50 text-foreground'
    : 'bg-links-background text-links-text';
  const interactiveSurfaceClassName = isEditorSurface
    ? 'hover:bg-input/70 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar'
    : 'hover:bg-links-background/90 focus-visible:ring-links-text';

  const content = (
    <>
      {!isEditorSurface && (
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md transition-colors',
            iconSurfaceClassName,
          )}
        >
          <Link2 aria-hidden="true" className="size-3.5" />
        </span>
      )}

      <span className="flex-1 truncate text-left" title={label}>
        {label}
      </span>

      {!isEditorSurface && (
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            iconSurfaceClassName,
          )}
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </span>
      )}
    </>
  );

  return (
    <div className={cn('w-full max-w-60', className)}>
      {!interactive ? (
        <div
          className={cn(
            'group flex w-full items-center gap-2 px-3 py-3 text-base font-normal',
            linkRadiusClassName,
            linkSurfaceClassName,
          )}
        >
          {content}
        </div>
      ) : as === 'button' ? (
        <button
          {...(elementProps as ButtonHTMLAttributes<HTMLButtonElement>)}
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          className={cn(
            'group flex w-full items-center gap-2 px-3 py-3 text-base font-normal transition-all duration-150 will-change-transform focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] active:shadow-inner',
            linkRadiusClassName,
            linkSurfaceClassName,
            interactiveSurfaceClassName,
          )}
        >
          {content}
        </button>
      ) : (
        <a
          {...(elementProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="ugc noopener noreferrer"
          className={cn(
            'group flex w-full items-center gap-2 px-3 py-3 text-base font-normal transition-all duration-150 will-change-transform focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] active:shadow-inner',
            linkRadiusClassName,
            linkSurfaceClassName,
            interactiveSurfaceClassName,
          )}
        >
          {content}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
});
