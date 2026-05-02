import { formatUrlLabel } from '@/helpers';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { WebsiteLink } from '@/features/profile/components';
import { Trash2 } from 'lucide-react';
import { AddLink } from './links';

type FormValues = {
  links: string[];
  _pendingLink: string;
};

export const LinksSection = () => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<FormValues>();
  const links = useWatch({ control, name: 'links' });

  const openEdit = (index: number) => {
    // Pre-fill the pending field with the existing link value
    setValue('_pendingLink', links[index]);
    setEditingIndex(index);
  };

  const updateLink = () => {
    if (editingIndex === null) return;
    const updatedLink = getValues('_pendingLink').trim();
    const next = [...links];
    next[editingIndex] = updatedLink;
    setValue('links', next, { shouldDirty: true, shouldValidate: true });
    setEditingIndex(null);
  };

  const removeLink = () => {
    if (editingIndex === null) return;
    setValue(
      'links',
      links.filter((_, i) => i !== editingIndex),
      { shouldDirty: true, shouldValidate: true },
    );
    setEditingIndex(null);
  };

  return (
    <>
      {links?.map((link, index) => (
        <Popover
          key={link}
          open={editingIndex === index}
          onOpenChange={(open) =>
            open ? openEdit(index) : setEditingIndex(null)
          }
        >
          <PopoverTrigger asChild>
            <button type="button">
              <WebsiteLink label={formatUrlLabel(link)} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-8">
            <Label>Edit link:</Label>
            <Input
              {...register('_pendingLink')}
              type="url"
              placeholder="https://example.com"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && updateLink()}
            />
            {errors._pendingLink && (
              <p className="text-destructive text-sm">
                {errors._pendingLink.message}
              </p>
            )}
            <div className="flex w-full flex-1 gap-2">
              <Button type="button" variant="destructive" onClick={removeLink}>
                <Trash2 />
              </Button>
              <Button type="button" onClick={updateLink}>
                Update
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ))}

      <AddLink links={links} />
    </>
  );
};
