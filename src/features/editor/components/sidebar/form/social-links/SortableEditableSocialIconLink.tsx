import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from '@/components/ui';
import {
  type PlatformName,
  SOCIAL_MAP,
  type SocialPlatform,
} from '@/constants';
import { deactivateSocialLink } from '@/features/editor/helpers/socialLinkOrdering';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { Trash2 } from 'lucide-react';

type SortableEditableSocialIconLinkProps = {
  canReorder: boolean;
  currentUrl: string;
  Icon: SocialPlatform['Icon'];
  label: SocialPlatform['label'];
  platform: PlatformName;
  position: number;
  total: number;
};

export const SortableEditableSocialIconLink = ({
  canReorder,
  currentUrl,
  Icon,
  label,
  platform,
  position,
  total,
}: SortableEditableSocialIconLinkProps) => {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: platform, disabled: !canReorder });
  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { getValues, setValue } = useFormContext<MetadataFormValues>();
  const activatorProps: React.ComponentProps<'button'> | undefined = canReorder
    ? {
        ...attributes,
        ...listeners,
        ref: setActivatorNodeRef,
      }
    : undefined;

  const closeDialog = () => {
    setOpen(false);
    setDraftUrl('');
    setError(null);
  };

  const handleSave = () => {
    const normalizedUrl = draftUrl.trim();

    if (!SOCIAL_MAP[platform].validateUrl(normalizedUrl)) {
      setError(`Please enter a valid ${label} URL.`);
      return;
    }

    setValue(
      'socialLinks',
      (getValues('socialLinks') ?? []).map((link) =>
        link.platform === platform ? { ...link, url: normalizedUrl } : link,
      ),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
    closeDialog();
  };

  const handleRemove = () => {
    setValue(
      'socialLinks',
      deactivateSocialLink(getValues('socialLinks') ?? [], platform),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
    closeDialog();
  };

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    activatorProps?.onKeyDown?.(event);

    if (event.defaultPrevented || event.key !== 'Enter') return;

    event.preventDefault();
    setDraftUrl(currentUrl);
    setError(null);
    setOpen(true);
  };

  const buttonLabel = canReorder
    ? `Edit or reorder ${label} social link, position ${position} of ${total}`
    : `Edit ${label} social link`;

  return (
    <li
      ref={setNodeRef}
      data-social-platform={platform}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={isDragging ? 'relative opacity-70' : 'relative'}
    >
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setDraftUrl(currentUrl);
            setError(null);
            setOpen(true);
            return;
          }

          closeDialog();
        }}
      >
        <DialogTrigger asChild>
          <Button
            {...activatorProps}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={buttonLabel}
            onKeyDown={handleTriggerKeyDown}
            className={`text-foreground hover:text-primary transition will-change-transform hover:bg-transparent active:shadow-inner ${
              canReorder ? 'cursor-grab touch-none active:cursor-grabbing' : ''
            } ${isDragging ? 'ring-ring/40 scale-105 shadow-sm ring-2' : ''}`}
          >
            <Icon aria-hidden="true" className="size-6" />
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit your {label} link:</DialogTitle>

            <DialogDescription>
              Changes are saved locally. Submit the profile form to publish
              them.
            </DialogDescription>
          </DialogHeader>

          <Input
            type="url"
            placeholder={`Enter your ${label} URL`}
            value={draftUrl}
            onChange={(event) => {
              setDraftUrl(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSave();
              }
            }}
          />

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="destructive" onClick={handleRemove}>
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!draftUrl.trim()}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
};
