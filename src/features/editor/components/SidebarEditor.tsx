import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
    imageValidation.avatar || imageValidation.coverPicture;
  const isBusy = isSubmitting || isCheckingImage;

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="text-foreground/70 border-foreground/40 items-start border-b">
        <Link
          to="/dashboard"
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
