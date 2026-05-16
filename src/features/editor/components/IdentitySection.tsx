import type { InBioProfile } from '@/schemas/inBioMetadata.schema';
import { useFormContext, useWatch } from 'react-hook-form';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

import { Identity } from '@/features/profile/components';

export const IdentitySection = ({
  lensHandle,
  profile,
}: {
  lensHandle: string;
  profile: InBioProfile;
}) => {
  const { control } = useFormContext<MetadataFormValues>();
  const formAvatar = useWatch({ control, name: 'avatar.preview' }) ?? undefined;
  const formName = useWatch({ control, name: 'name' });
  const formBio = useWatch({ control, name: 'bio' });

  const formProfile = {
    avatar: formAvatar,
    name: formName,
    bio: formBio,
  };

  const mergedProfile = {
    ...profile,
    ...formProfile,
  };
  return <Identity lensHandle={lensHandle} profile={mergedProfile} />;
};
