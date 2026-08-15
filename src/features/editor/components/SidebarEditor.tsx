import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  Text,
} from '@/components/ui';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';
import {
  AppearanceGroup,
  DisplayGroup,
  IdentityGroup,
  PresenceGroup,
} from './sidebar';

export const SidebarEditor = () => {
  const {
    formState: { isDirty, isSubmitting },
    watch,
  } = useFormContext<MetadataFormValues>();
  const imageValidation = watch('_imageValidation');
  const isCheckingImage =
    imageValidation.avatar ||
    imageValidation.coverPicture ||
    imageValidation.linksPanelBackground;
  const isBusy = isSubmitting || isCheckingImage;

  return (
    <Sidebar
      variant="floating"
      className="**:data-[slot=sidebar-inner]:shadow-none"
    >
      <SidebarTrigger
        type="button"
        className="bg-card/90 absolute top-4 left-full z-30 ml-4 shadow-sm backdrop-blur"
      />
      <SidebarHeader className="text-foreground/70 border-foreground/40 items-start border-b">
        <Link
          to="/app/dashboard"
          aria-disabled={isBusy}
          onClick={(event) => {
            if (isBusy) event.preventDefault();
          }}
          className="hover:text-foreground aria-disabled:text-muted-foreground flex items-center gap-1 text-sm hover:underline aria-disabled:pointer-events-none aria-disabled:no-underline"
        >
          <ChevronLeft size={14} />
          Back to dashboard
        </Link>
        <Text variant="h3" className="text-foreground font-semibold">
          Profile editor
        </Text>
      </SidebarHeader>
      <SidebarContent>
        <IdentityGroup />
        <PresenceGroup />
        <AppearanceGroup />
        <DisplayGroup />
      </SidebarContent>
      <SidebarFooter className="border-foreground/40 border-t py-3">
        <div
          role="note"
          aria-label="Alpha release notice"
          className="border-accent bg-accent/20 rounded-lg border px-3 py-2 text-xs leading-5"
        >
          <p className="font-semibold">Alpha software</p>
          <p className="text-foreground/70">
            Saving publishes real metadata to Lens mainnet. If confirmation
            times out, check your profile before trying again.
          </p>
        </div>
        <Button
          type="submit"
          form="profile-editor-form"
          disabled={!isDirty || isBusy}
        >
          {isSubmitting
            ? 'Saving...'
            : isCheckingImage
              ? 'Checking image...'
              : 'Save Changes'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
