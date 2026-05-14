import { useFormContext, useWatch } from 'react-hook-form';
import { type MetadataFormValues } from '../schemas/metadataForm.schema';

import { CoverPicture } from '@/features/profile/components';

export const CoverPictureSection = () => {
  const { control } = useFormContext<MetadataFormValues>();
  const coverPicture = useWatch({ control, name: 'coverPicture.preview' });

  return <CoverPicture coverPicture={coverPicture} />;
};
