import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { useFormContext, useWatch } from 'react-hook-form';

import { Field, Label, Switch } from '@/components/ui';

export const StatisticsSwitch = () => {
  const { setValue, control } = useFormContext<MetadataFormValues>();

  const isChecked = useWatch({ control, name: 'displayStatistics' });

  return (
    <Field orientation="horizontal">
      <Switch
        id="display-statistics"
        checked={isChecked}
        onCheckedChange={(pressed) =>
          setValue('displayStatistics', pressed, { shouldDirty: true })
        }
        size="sm"
      />
      <Label htmlFor="display-statistics">Statistics</Label>
    </Field>
  );
};
