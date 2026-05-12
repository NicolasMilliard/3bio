import { type PlatformName, SOCIAL_MAP } from '@/constants';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
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
} from '@/components/ui';

export const EditableSocialLinks = () => {
  const { control } = useFormContext<MetadataFormValues>();
  const socialLinks = useWatch({ control, name: 'socialLinks' });

  if (!socialLinks?.length) return null;

  return (
    <div className="flex max-w-prose flex-wrap items-center gap-3">
      {socialLinks.map((link, index) => {
        if (!link.url) return null;

        const platform = SOCIAL_MAP[link.platform as PlatformName];

        return (
          <EditableSocialLink
            key={link.platform}
            index={index}
            label={platform.label}
            icon={<platform.Icon className="size-6" />}
          />
        );
      })}
    </div>
  );
};

type EditableSocialLinkProps = {
  index: number;
  label: string;
  icon: React.ReactNode;
};

const EditableSocialLink = ({
  index,
  label,
  icon,
}: EditableSocialLinkProps) => {
  const { register, setValue } = useFormContext<MetadataFormValues>();

  const handleRemove = () => {
    setValue(`socialLinks.${index}.url`, '');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-primary hover:text-chart-2 cursor-pointer transition">
          {icon}
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit your {label} link:</DialogTitle>

          <DialogDescription>
            Changes are saved locally. Submit the profile form to publish them.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder={`Enter your ${label} URL`}
          {...register(`socialLinks.${index}.url`)}
        />

        <DialogFooter>
          <Button type="button" variant="destructive" onClick={handleRemove}>
            Remove
          </Button>
          <DialogClose asChild>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
