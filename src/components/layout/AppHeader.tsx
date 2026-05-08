import { useMatchRoute } from '@tanstack/react-router';

import { AuthButton } from '@/features/auth/components';
import { Link } from '@tanstack/react-router';
import { InBioLogo } from '../icons/InBioLogo';
import { Button } from '../ui/button';

export const AppHeader = () => {
  const matchRoute = useMatchRoute();
  const isHome = !!matchRoute({ to: '/' });

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className="from-background/80 via-background/40 to-background/0 absolute inset-0 bg-linear-to-b backdrop-blur"
        style={{
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 80%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link to="/">
          <InBioLogo isAtTop />
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
