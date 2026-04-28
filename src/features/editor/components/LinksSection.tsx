import { formatUrlLabel } from '@/helpers';
import { useFormContext, useWatch } from 'react-hook-form';

import { WebsiteLink } from '@/features/profile/components';
import { AddLink } from './links';

export const LinksSection = () => {
  const { control } = useFormContext<{ links: string[] }>();
  const links = useWatch({ control, name: 'links' });

  return (
    <>
      {links.map((link) => (
        <button
          key={link}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            console.log('clicked');
          }}
        >
          <WebsiteLink href={link} label={formatUrlLabel(link)} />
        </button>
      ))}

      <AddLink links={links} />
    </>
  );
};
