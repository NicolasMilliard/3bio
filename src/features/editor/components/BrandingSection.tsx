import { useFormContext, useWatch } from 'react-hook-form';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

import { Branding } from '@/features/profile/components';

export const BrandingSection = () => {
  const { control } = useFormContext<MetadataFormValues>();

  const displayBranding = useWatch({ control, name: 'displayBranding' });

  return displayBranding && <Branding />;
};
