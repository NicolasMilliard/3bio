import { useFormContext, useWatch } from 'react-hook-form';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

import { Toggle } from '@/components/ui';
import { FileSpreadsheet } from 'lucide-react';

export const BrandingToggle = () => {
  const { setValue, control } = useFormContext<MetadataFormValues>();

  const isPressed = useWatch({ control, name: 'displayBranding' });

  return (
    <Toggle
      aria-label="Toggle branding"
      variant="outline"
      pressed={isPressed}
      onPressedChange={(pressed) =>
        setValue('displayBranding', pressed, { shouldDirty: true })
      }
    >
      <FileSpreadsheet />
      Branding
    </Toggle>
  );
};
