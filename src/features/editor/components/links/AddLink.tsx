import { isValidUrl } from '@/helpers';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { Plus } from 'lucide-react';

type FormValues = {
  links: string[];
  _pendingLink: string;
};

export const AddLink = ({ links }: { links?: string[] }) => {
  const [open, onOpenChange] = useState(false);
  const {
    register,
    setError,
    clearErrors,
    getValues,
    setValue,
    resetField,
    formState: { errors },
  } = useFormContext<FormValues>();

  const addLink = (newLink: string) => {
    setValue('links', [...(links ?? []), newLink], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleConfirm = () => {
    const value = getValues('_pendingLink').trim();

    if (!value) {
      setError('_pendingLink', { message: 'Link is required.' });
      return;
    }

    if (!isValidUrl(value)) {
      setError('_pendingLink', { message: 'Please enter a valid URL.' });
      return;
    }

    clearErrors('_pendingLink');
    resetField('_pendingLink');
    addLink(value);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          Add link <Plus size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-8">
        <Label>Add link:</Label>
        <Input
          {...register('_pendingLink')}
          type="url"
          placeholder="https://example.com"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />
        {errors._pendingLink && (
          <p className="text-destructive text-sm">
            {errors._pendingLink.message}
          </p>
        )}
        <Button type="button" onClick={handleConfirm}>
          Add
        </Button>
      </PopoverContent>
    </Popover>
  );
};
