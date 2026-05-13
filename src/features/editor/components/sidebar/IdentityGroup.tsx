import { useFormContext } from 'react-hook-form';
import { useEditorContext } from '../../context/editor.context';
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
  const { account, inBioMetadata } = useEditorContext();
  const avatarPath = inBioMetadata.profile?.avatar ?? account.metadata?.picture;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="pl-0 tracking-wider">
        Identity
      </SidebarGroupLabel>
      <div className="flex flex-col gap-4">
        <PictureController picturePath={avatarPath} formValue="avatar" />
        <NameInput />
        <BioInput />
      </div>
    </SidebarGroup>
  );
};

const NameInput = () => {
  const { register } = useFormContext<MetadataFormValues>();
  const { account, inBioMetadata } = useEditorContext();
  const name = account.metadata?.name;
  const inBioName = inBioMetadata.profile?.name;

  return (
    <FieldSet className="gap-2">
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        {...register('name')}
        placeholder={inBioName ?? name ?? 'Your name'}
      />
    </FieldSet>
  );
};

const BioInput = () => {
  const { register } = useFormContext<MetadataFormValues>();
  const { account, inBioMetadata } = useEditorContext();
  const bio = account.metadata?.bio;
  const inBioBio = inBioMetadata.profile?.bio;

  return (
    <FieldSet className="gap-2">
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        {...register('bio')}
        rows={1}
        defaultValue={inBioBio ?? bio ?? undefined}
        placeholder="Write something about yourself in your bio to let people know more about you."
      />
    </FieldSet>
  );
};
