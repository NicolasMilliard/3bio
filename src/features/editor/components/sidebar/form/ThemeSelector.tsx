import {
  THREE_BIO_THEME_NAMES,
  type ThreeBioThemeName,
} from '@/constants';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { threeBioThemeNameSchema } from '@/schemas/threeBioMetadata.schema';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

const formatThemeLabel = (theme: ThreeBioThemeName) =>
  `${theme.charAt(0).toUpperCase()}${theme.slice(1)}`;

export const ThemeSelector = () => {
  const { setValue, control } = useFormContext<MetadataFormValues>();

  const theme = useWatch({
    control,
    name: 'theme',
  });

  return (
    <Select
      value={theme}
      onValueChange={(value) => {
        setValue('theme', threeBioThemeNameSchema.parse(value), {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }}
    >
      <SelectTrigger className="w-full rounded-lg">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        <SelectGroup>
          {THREE_BIO_THEME_NAMES.map((themeName) => (
            <SelectItem
              key={themeName}
              value={themeName}
              className="rounded-md"
            >
              {formatThemeLabel(themeName)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
