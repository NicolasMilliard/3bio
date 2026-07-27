import { THREEBIO_GITHUB_URL } from '@/constants';
import { Link } from '@tanstack/react-router';
import { Logo } from '../icons/Logo';

export const Footer = () => {
  const licenseUrl = `${THREEBIO_GITHUB_URL}/blob/main/LICENSE`;

  return (
    <footer className="bg-primary text-primary-foreground w-full px-4">
      <div className="mx-auto max-w-6xl py-8">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div className="max-w-sm">
            <Link
              to="/"
              aria-label="3bio home"
              className="focus-visible:ring-accent inline-flex rounded-sm focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
            >
              <Logo />
            </Link>
            <p className="mt-3 text-sm leading-6">
              Open-source link in bio profiles for Lens.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <li>
                <FooterLink href={THREEBIO_GITHUB_URL}>Source code</FooterLink>
              </li>
              <li>
                <FooterLink href={licenseUrl}>MIT license</FooterLink>
              </li>
              <li>
                <FooterLink href="https://lens.xyz">Lens</FooterLink>
              </li>
            </ul>
          </nav>
        </div>

        <div className="text-primary-foreground mt-8 flex flex-col gap-2 border-t border-current/20 pt-5 text-xs leading-5 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nicolas Milliard.</p>
          <p>
            Source code is MIT-licensed. 3bio does not claim ownership of
            creator content.
          </p>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ href, children }: { href: string; children: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-accent focus-visible:ring-accent rounded-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
  >
    {children}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);
