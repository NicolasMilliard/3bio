import { SidebarGroup, SidebarGroupLabel } from '@/components/ui';
import { PictureController, ThemeSelector } from './form';

export const AppearanceGroup = () => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="pl-0 tracking-wider">
        Appearance &amp; sharing
      </SidebarGroupLabel>
      <div className="flex flex-col gap-4">
        <ThemeSelector />
        <PictureController
          formValue="linksPanelBackground"
          label="Links panel background"
          description="Fills the entire links panel and is center-cropped to fit every screen. Keep important details near the center; a 1600 × 1600 px image works best."
        />
        <PictureController
          formValue="coverPicture"
          label="Social share image"
          description="Used for Open Graph and X/Twitter previews. It is not displayed on your profile. 1200 × 630 px is recommended."
        />
      </div>
    </SidebarGroup>
  );
};
