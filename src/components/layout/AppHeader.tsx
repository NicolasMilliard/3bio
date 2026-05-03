import { useMatchRoute } from '@tanstack/react-router';

import { AuthButton } from '@/features/auth/components';
import { Link } from '@tanstack/react-router';
import { InBioLogo } from '../icons/InBioLogo';
import { Button } from '../ui/button';

export const AppHeader = () => {
  const matchRoute = useMatchRoute();
  const isHome = !!matchRoute({ to: '/' });

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link to="/">
          <InBioLogo />
        </Link>

        <nav className="flex items-center gap-2">
          {isHome ? (
            <Button asChild>
              <Link to="/dashboard">Launch App</Link>
            </Button>
          ) : (
            <AuthButton />
          )}
        </nav>
      </div>
    </header>
  );
};
