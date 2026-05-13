import { useEditorContext } from '@/features/editor/context/editor.context';

import { SidebarGroup, SidebarGroupLabel } from '@/components/ui';
import { PictureController, ThemeSelector } from './form';

export const AppearanceGroup = () => {
  const { account, inBioMetadata } = useEditorContext();
  const coverPicturePath =
    inBioMetadata.profile?.coverPicture ?? account.metadata?.coverPicture;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="pl-0 tracking-wider">
        Appearance
      </SidebarGroupLabel>
      <div className="flex flex-col gap-4">
        <ThemeSelector />
        <PictureController
          picturePath={coverPicturePath}
          formValue="coverPicture"
        />
      </div>
    </SidebarGroup>
  );
};
