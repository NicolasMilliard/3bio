import { Button } from '@/components/ui';
import { Link } from '@tanstack/react-router';

export const NotFoundScreen = ({ lensHandle }: { lensHandle?: string }) => {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-3xl">Profile not found.</h1>
      {lensHandle && (
        <p>
          Did you misspell <strong>{lensHandle}</strong>?
        </p>
      )}
      <Button asChild>
        <Link to="/">Go back home</Link>
      </Button>
    </main>
  );
};
