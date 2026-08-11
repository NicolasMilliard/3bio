import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_DIMENSION_HELP_TEXT,
  IMAGE_UPLOAD_HELP_TEXT,
  validateImageUpload,
} from '@/features/editor/schemas/imageUpload.schema';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  Button,
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
import { ImageIcon, InfoIcon } from 'lucide-react';

type PictureControllerProps = {
  formValue: 'coverPicture' | 'linksPanelBackground' | 'avatar';
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
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const currentPicture = useWatch({ control, name: formValue })?.preview;
  const imageError = errors[formValue]?.file ?? errors[formValue]?.preview;
  const normalizedLabel = label.toLowerCase();
  const inputId = `${formValue}-image`;
  const validationField = `_imageValidation.${formValue}` as const;
  const requirementsId = `${inputId}-requirements`;
  const guidanceId = `${inputId}-guidance`;
  const errorId = imageError ? `${inputId}-error` : undefined;
  const describedBy = [requirementsId, errorId].filter(Boolean).join(' ');
  const previewClassName =
    formValue === 'avatar' ? 'size-8 rounded-full' : 'h-8 w-12 rounded-sm';

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
      <div className="flex flex-col">
        <div className="flex min-h-8 items-center gap-1.5">
          <Label htmlFor={inputId}>{label}</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Image guidance for ${normalizedLabel}`}
            aria-controls={guidanceId}
            aria-expanded={isGuidanceOpen}
            className="text-muted-foreground/80 hover:border-border/80 hover:bg-background hover:text-foreground size-7 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out hover:shadow-xs active:translate-y-0 aria-expanded:border-border aria-expanded:bg-background aria-expanded:text-foreground aria-expanded:shadow-xs"
            onClick={() => setIsGuidanceOpen((open) => !open)}
          >
            <InfoIcon
              aria-hidden="true"
              className="size-3.5"
              strokeWidth={1.75}
            />
          </Button>
        </div>

        <div
          id={guidanceId}
          aria-hidden={!isGuidanceOpen}
          data-state={isGuidanceOpen ? 'open' : 'closed'}
          className={cn(
            'grid transition-[grid-template-rows,opacity,transform,margin-top,margin-bottom] motion-reduce:transform-none motion-reduce:transition-none',
            isGuidanceOpen
              ? 'mt-2.5 mb-1 grid-rows-[1fr] translate-y-0 opacity-100 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]'
              : 'pointer-events-none mt-0 mb-0 grid-rows-[0fr] -translate-y-1 opacity-0 duration-150 ease-out',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-border/80 bg-muted/20 flex flex-col rounded-xl border px-3 py-2.5">
              {description && (
                <Text className="text-muted-foreground text-xs leading-relaxed">
                  {description}
                </Text>
              )}
              <Text className="border-border/70 text-foreground/80 mt-2 border-t pt-2 text-xs leading-snug font-medium">
                {IMAGE_UPLOAD_DIMENSION_HELP_TEXT}
              </Text>
            </div>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-busy={isValidating}
            aria-describedby={describedBy}
            aria-invalid={Boolean(imageError)}
            disabled={isValidating}
            className="bg-input/50 hover:bg-input/70 focus-visible:border-ring focus-visible:ring-ring/30 flex h-10 w-full items-center gap-3 rounded-lg border border-transparent px-3 text-left text-sm transition-[color,box-shadow,background-color] outline-none select-none focus-visible:ring-3"
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
        id={requirementsId}
        className="text-muted-foreground text-xs leading-snug"
      >
        {IMAGE_UPLOAD_HELP_TEXT}
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
