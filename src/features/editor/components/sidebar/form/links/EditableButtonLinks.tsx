import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { formatUrlLabel } from '@/helpers';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

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
  Text,
} from '@/components/ui';
import { LinkButton } from '@/features/profile/components';
import { Trash2 } from 'lucide-react';

export const EditableButtonLinks = () => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, setValue } = useFormContext<MetadataFormValues>();
  const links = useWatch({ control, name: 'links' });

  const draftValue = editingIndex !== null ? (links?.[editingIndex] ?? '') : '';

  const isValidUrl = () => {
    if (!draftValue.trim()) return false;

    try {
      new URL(draftValue);

      return true;
    } catch {
      return false;
    }
  };

  const closeDialog = () => {
    setEditingIndex(null);
    setError(null);
  };

  const updateLink = () => {
    if (editingIndex === null) return;

    const normalizedUrl = draftValue.trim();

    if (!isValidUrl) {
      setError('Please enter a valid URL.');

      return;
    }

    const nextLinks = links ? [...links] : [];
    nextLinks[editingIndex] = normalizedUrl;

    setValue('links', nextLinks, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    closeDialog();
  };

  const removeLink = () => {
    if (editingIndex === null) return;

    setValue(
      'links',
      links?.filter((_, index) => index !== editingIndex),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );

    closeDialog();
  };

  return (
    <>
      {links?.map((link, index) => (
        <Dialog
          key={index}
          open={editingIndex === index}
          onOpenChange={(open) => {
            if (open) {
              setEditingIndex(index);
              return;
            }
            closeDialog();
          }}
        >
          <DialogTrigger asChild>
            <LinkButton label={formatUrlLabel(link)} />
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit link</DialogTitle>
              <DialogDescription>
                Changes are saved locally. Submit the profile form to publish
                them.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                type="url"
                placeholder="https://example.com"
                value={draftValue}
                onChange={(e) => {
                  const next = e.target.value;
                  const nextLinks = [...links];

                  if (editingIndex !== null) {
                    nextLinks[editingIndex] = next;

                    setValue('links', nextLinks, {
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }

                  if (error) {
                    setError(null);
                  }
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateLink();
                  }
                }}
              />
              {error && (
                <Text className="text-destructive text-sm">{error}</Text>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={removeLink}
                >
                  <Trash2 />
                  Remove
                </Button>
              </DialogClose>

              <Button
                type="button"
                onClick={updateLink}
                disabled={!draftValue.trim()}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </>
  );
};
