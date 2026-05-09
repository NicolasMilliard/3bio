import { Link } from '@tanstack/react-router';
import { InBioLogo } from '../icons/InBioLogo';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground w-full px-4">
      <div className="mx-auto flex max-w-6xl gap-12 py-8">
        <Link to="/">
          <InBioLogo />
        </Link>
        <ul>
          <li>
            <Link to="/" className="hover:text-accent transition-colors">
              Terms & Conditions
            </Link>
          </li>
          <li>
            <Link to="/" className="hover:text-accent transition-colors">
              Privacy Notice
            </Link>
          </li>
          <li>
            <Link to="/" className="hover:text-accent transition-colors">
              Cookie Notice
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};
