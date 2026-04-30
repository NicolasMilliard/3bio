import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ProfileFormValues } from '../schemas/profileForm.schema';

import { Button } from '@/components/ui';
import { Image } from 'lucide-react';

export const BannerInput = () => {
  const { setValue } = useFormContext<ProfileFormValues>();
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const previewURL = URL.createObjectURL(selectedFile);

    setValue(
      'banner',
      {
        file: selectedFile,
        preview: previewURL,
      },
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  return (
    <>
      <Button variant="outline" type="button" onClick={openFilePicker}>
        <Image />
        Edit banner
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </>
  );
};
