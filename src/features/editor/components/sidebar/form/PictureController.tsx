import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_HELP_TEXT,
  validateImageUpload,
} from '@/features/editor/schemas/imageUpload.schema';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FieldError,
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
  const {
    clearErrors,
    control,
    formState: { errors },
    setError,
    setValue,
  } = useFormContext<MetadataFormValues>();
  const inputRef = useRef<HTMLInputElement>(null);
  const validationRequestRef = useRef(0);
  const [isValidating, setIsValidating] = useState(false);
  const currentPicture = useWatch({ control, name: formValue })?.preview;
  const imageError = errors[formValue]?.file ?? errors[formValue]?.preview;
  const normalizedLabel = label.toLowerCase();
  const inputId = `${formValue}-image`;
  const validationField = `_imageValidation.${formValue}` as const;
  const descriptionId = `${inputId}-description`;
  const errorId = imageError ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');
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

  useEffect(
    () => () => {
      validationRequestRef.current += 1;
    },
    [],
  );

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) return;

    const requestId = ++validationRequestRef.current;
    setIsValidating(true);
    setValue(validationField, true, { shouldDirty: false });
    clearErrors(formValue);

    try {
      const validationError = await validateImageUpload(selectedFile);

      if (requestId !== validationRequestRef.current) return;

      if (validationError) {
        setError(`${formValue}.file`, {
          type: 'validate',
          message: validationError,
        });
        return;
      }

      const previewURL = URL.createObjectURL(selectedFile);

      setValue(
        formValue,
        { file: selectedFile, preview: previewURL },
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        },
      );
    } catch {
      if (requestId !== validationRequestRef.current) return;

      setError(`${formValue}.file`, {
        type: 'validate',
        message: 'The selected image could not be checked. Choose it again.',
      });
    } finally {
      if (requestId === validationRequestRef.current) {
        setValue(validationField, false, { shouldDirty: false });
        setIsValidating(false);
      }
    }
  };

  const removePicture = () => {
    clearErrors(formValue);
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
            aria-busy={isValidating}
            aria-describedby={describedBy}
            aria-invalid={Boolean(imageError)}
            disabled={isValidating}
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

            <span>{isValidating ? 'Checking image...' : label}</span>
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

      <Text
        id={descriptionId}
        className="text-muted-foreground text-xs leading-snug"
      >
        {[description, IMAGE_UPLOAD_HELP_TEXT].filter(Boolean).join(' ')}
      </Text>

      <FieldError id={errorId} errors={[imageError]} />

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        aria-describedby={describedBy}
        aria-invalid={Boolean(imageError)}
        className="hidden"
        onChange={(event) => void onFileChange(event)}
      />
    </FieldSet>
  );
};
