import { useFormContext, useWatch } from 'react-hook-form';
import { type ProfileFormValues } from '../schemas/profileForm.schema';

export const BannerSection = () => {
  const { control } = useFormContext<ProfileFormValues>();
  const banner = useWatch({ control, name: 'banner' });
  const preview = banner?.preview;

  return (
    <>
      {preview && (
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center blur brightness-85 saturate-130"
            style={{ backgroundImage: `url(${preview})` }}
          />
        </div>
      )}
      <div className="bg-muted/18 fixed inset-0 z-1 sm:hidden" />
    </>
  );
};
