import { Spinner } from './spinner';

export const SpinnerScreen = ({
  text,
  as: Root = 'div',
}: {
  text?: string;
  as?: 'div' | 'main';
}) => {
  return (
    <Root className="flex min-h-dvh flex-1 items-center justify-center">
      <div role="status" aria-live="polite" className="flex items-center gap-2">
        <Spinner aria-hidden="true" className="size-8" />
        <span>{text || 'Loading...'}</span>
      </div>
    </Root>
  );
};
