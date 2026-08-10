import { ALL_SOCIAL_PLATFORMS, type PlatformName } from '@/constants';
import { activateSocialLink } from '@/features/editor/helpers/socialLinkOrdering';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { useState } from 'react';
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
  Text,
} from '@/components/ui';
import { Plus } from 'lucide-react';
import { MenuSocialIcon } from './MenuSocialIcon';

export const AddSocialIconLink = () => {
  const [open, setOpen] = useState(false);
  const [pendingPlatformName, setPendingPlatformName] =
    useState<PlatformName | null>(null);

  const [pendingUrl, setPendingUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const { control, setValue } = useFormContext<MetadataFormValues>();

  const socialLinks = useWatch({ control, name: 'socialLinks' });

  const activePlatformTypes = new Set(
    socialLinks?.filter((link) => !!link.url).map((link) => link.platform),
  );

  const selectedPlatform = ALL_SOCIAL_PLATFORMS.find(
    (platform) => platform.value === pendingPlatformName,
  );

  const handleClose = () => {
    setPendingPlatformName(null);
    setPendingUrl('');
    setUrlError(null);
    setOpen(false);
  };

  const handleConfirm = () => {
    if (!socialLinks || !pendingPlatformName || !pendingUrl.trim()) return;

    const normalizedUrl = pendingUrl.trim();
    const isValid = selectedPlatform?.validateUrl(normalizedUrl) ?? false;

    if (!isValid) {
      setUrlError(`Please enter a valid ${selectedPlatform?.label} URL.`);
      return;
    }

    setValue(
      'socialLinks',
      activateSocialLink(socialLinks, pendingPlatformName, normalizedUrl),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );

    handleClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) handleClose();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Add a social link"
          className="rounded-md"
        >
          <Plus aria-hidden="true" size={16} />
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-xl **:data-[slot=button]:rounded-lg **:data-[size=icon-sm]:rounded-md **:data-[slot=input]:rounded-lg **:data-[slot=input-group]:rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {pendingPlatformName
              ? `Add your ${selectedPlatform?.label}`
              : 'Add a social link'}
          </DialogTitle>

          <DialogDescription>
            Changes are saved locally. Submit the profile form to publish them.
          </DialogDescription>
        </DialogHeader>

        {pendingPlatformName ? (
          <div className="space-y-4">
            <Input
              type="url"
              placeholder={selectedPlatform?.placeholder}
              value={pendingUrl}
              onChange={(e) => {
                setPendingUrl(e.target.value);

                if (urlError) {
                  setUrlError(null);
                }
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />

            {urlError && (
              <Text className="text-destructive text-sm">{urlError}</Text>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPendingPlatformName(null);
                  setPendingUrl('');
                  setUrlError(null);
                }}
              >
                Back
              </Button>

              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!pendingUrl.trim()}
              >
                Add
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <MenuSocialIcon
            activePlatformTypes={activePlatformTypes}
            setPendingType={setPendingPlatformName}
            setPendingUrl={setPendingUrl}
          />
        )}

        <DialogClose />
      </DialogContent>
    </Dialog>
  );
};
