import { useFormContext, useWatch } from 'react-hook-form';
import type { MetadataFormValues } from '../../schemas/metadataForm.schema';

import { Field, Label, Switch } from '@/components/ui';

export const BrandingSwitch = () => {
  const { setValue, control } = useFormContext<MetadataFormValues>();

  const isChecked = useWatch({ control, name: 'displayBranding' });

  return (
    <Field orientation="horizontal">
      <Switch
        id="display-branding"
        className="cursor-pointer"
        checked={isChecked}
        onCheckedChange={(pressed) =>
          setValue('displayBranding', pressed, { shouldDirty: true })
        }
      />
      <Label htmlFor="display-branding" className="cursor-pointer">
        {isChecked ? 'Hide' : 'Show'} branding
      </Label>
    </Field>
  );
};
