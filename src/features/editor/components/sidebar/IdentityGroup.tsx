import { useFormContext } from 'react-hook-form';
import type { MetadataFormValues } from '../../schemas/metadataForm.schema';

import {
  FieldSet,
  Input,
  Label,
  SidebarGroup,
  SidebarGroupLabel,
  Textarea,
} from '@/components/ui';
import { PictureController } from './form';

export const IdentityGroup = () => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="pl-0 tracking-wider">
        Identity
      </SidebarGroupLabel>
      <div className="flex flex-col gap-4">
        <PictureController
          formValue="avatar"
          label="Avatar"
          description="Shown with your profile details and cropped to a circle. A square image with the subject centered works best."
        />
        <NameInput />
        <BioInput />
      </div>
    </SidebarGroup>
  );
};

const NameInput = () => {
  const { register } = useFormContext<MetadataFormValues>();

  return (
    <FieldSet className="gap-2">
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        {...register('name')}
        placeholder="Your name"
      />
    </FieldSet>
  );
};

const BioInput = () => {
  const { register } = useFormContext<MetadataFormValues>();

  return (
    <FieldSet className="gap-2">
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        {...register('bio')}
        rows={1}
        placeholder="Write something about yourself in your bio to let people know more about you."
      />
    </FieldSet>
  );
};
