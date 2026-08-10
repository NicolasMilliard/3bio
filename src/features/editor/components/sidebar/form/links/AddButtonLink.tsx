import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { isValidUrl } from '@/helpers';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from '@/components/ui';
import { Plus } from 'lucide-react';

export const AddButtonLink = () => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { setValue, watch } = useFormContext<MetadataFormValues>();

  const links = watch('links') ?? [];

  const reset = () => {
    setDraft('');
    setError(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const handleAdd = () => {
    const value = draft.trim();

    if (!value) {
      setError('Link is required.');
      return;
    }

    if (!isValidUrl(value)) {
      setError('Please enter a valid URL.');
      return;
    }

    setValue('links', [...links, value], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="rounded-lg">
          Add link <Plus size={16} />
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-xl **:data-[slot=button]:rounded-lg **:data-[size=icon-sm]:rounded-md **:data-[slot=input]:rounded-lg **:data-[slot=input-group]:rounded-lg">
        <DialogHeader>
          <DialogTitle>Add link</DialogTitle>
          <DialogDescription>
            Add a new external link to your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="url"
            placeholder="https://example.com"
            value={draft}
            autoFocus
            onChange={(e) => {
              setDraft(e.target.value);

              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={reset}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleAdd} disabled={!draft.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
