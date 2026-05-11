import { useFieldArray, useFormContext } from 'react-hook-form';
import type { SocialLink } from '../../schemas/metadataForm.schema';

import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';

export const EditSocialIconLink = ({
  icon,
  label,
  type,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
}) => {
  const { control, register, watch } = useFormContext<{
    socialLinks: SocialLink[];
  }>();
  const { fields, update } = useFieldArray({ control, name: 'socialLinks' });

  const idx = fields.findIndex((f) => f.platform === type);
  const url = watch(`socialLinks.${idx}.url`);

  const handleRemove = () => {
    if (idx !== -1) update(idx, { platform: type, url: '' });
  };

  if (idx === -1) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-primary hover:text-chart-2 cursor-pointer transition">
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-8">
        <Label>Edit your {label} link:</Label>
        <Input {...register(`socialLinks.${idx}.url`)} defaultValue={url} />
        <Button type="button" variant="destructive" onClick={handleRemove}>
          Remove
        </Button>
      </PopoverContent>
    </Popover>
  );
};
