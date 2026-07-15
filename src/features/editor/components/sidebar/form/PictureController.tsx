import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FieldSet,
  Image,
  Label,
  Text,
} from '@/components/ui';
import { ImageIcon } from 'lucide-react';

type PictureControllerProps = {
  formValue: 'coverPicture' | 'avatar';
  label: string;
  description?: string;
};

export const PictureController = ({
  formValue,
  label,
  description,
}: PictureControllerProps) => {
  const { control, setValue } = useFormContext<MetadataFormValues>();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentPicture = useWatch({ control, name: formValue })?.preview;
  const normalizedLabel = label.toLowerCase();
  const inputId = `${formValue}-image`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const previewClassName =
    formValue === 'avatar' ? 'size-8 rounded-full' : 'h-8 w-12 rounded-md';

  useEffect(
    () => () => {
      if (currentPicture?.startsWith('blob:')) {
        URL.revokeObjectURL(currentPicture);
      }
    },
    [currentPicture],
  );

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const previewURL = URL.createObjectURL(selectedFile);

    setValue(
      formValue,
      { file: selectedFile, preview: previewURL },
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    event.target.value = '';
  };

  const removePicture = () => {
    setValue(
      formValue,
      { file: undefined, preview: null },
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  return (
    <FieldSet className="gap-2">
      <Label htmlFor={inputId}>{label}</Label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-describedby={descriptionId}
            className="bg-input/50 hover:bg-input/70 focus-visible:border-ring focus-visible:ring-ring/30 flex h-10 w-full items-center gap-3 rounded-3xl border border-transparent px-3 text-left text-sm transition-[color,box-shadow,background-color] outline-none select-none focus-visible:ring-3"
          >
            <span
              className={cn(
                'bg-muted flex shrink-0 items-center justify-center overflow-hidden',
                previewClassName,
              )}
            >
              {currentPicture ? (
                <Image
                  key={currentPicture}
                  src={currentPicture}
                  alt=""
                  aria-hidden="true"
                  className={cn('object-cover', previewClassName)}
                />
              ) : (
                <ImageIcon aria-hidden="true" className="size-4" />
              )}
            </span>

            <span>{label}</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem onSelect={openFilePicker}>
            {currentPicture ? 'Change' : 'Upload'} {normalizedLabel}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={!currentPicture}
            onSelect={removePicture}
          >
            Remove {normalizedLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {description && (
        <Text
          id={descriptionId}
          className="text-muted-foreground text-xs leading-snug"
        >
          {description}
        </Text>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-describedby={descriptionId}
        className="hidden"
        onChange={onFileChange}
      />
    </FieldSet>
  );
};
