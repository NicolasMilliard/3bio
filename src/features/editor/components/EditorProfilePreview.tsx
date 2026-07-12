import type { ThreeBioThemeName } from '@/constants';
import { useFormContext, useWatch } from 'react-hook-form';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

import { ProfileSection } from '@/features/profile/components';

export const EditorProfilePreview = ({
  children,
  defaultTheme,
}: {
  children: React.ReactNode;
  defaultTheme: ThreeBioThemeName;
}) => {
  const { control } = useFormContext<MetadataFormValues>();

  const watchedTheme = useWatch({
    control,
    name: 'theme',
  });
  return (
    <ProfileSection dataTheme={watchedTheme ?? defaultTheme}>
      {children}
    </ProfileSection>
  );
};
