import { ALL_SOCIAL_PLATFORMS, type PlatformName } from '@/constants';
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { SocialLink } from '../../schemas/profileForm.schema';

import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { Plus } from 'lucide-react';
import { MenuSocialIcon } from './MenuSocialIcon';

export const AddSocialIconLink = () => {
  const [open, setOpen] = useState(false);
  const [pendingPlatformName, setPendingPlatformName] =
    useState<PlatformName | null>(null);
  const [pendingUrl, setPendingUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const { control } = useFormContext<{ socialLinks: SocialLink[] }>();
  const { fields, update } = useFieldArray({ control, name: 'socialLinks' });
  const socialLinks = useWatch({ control, name: 'socialLinks' });

  const activePlatformTypes = new Set(
    socialLinks.filter((l) => l.url !== undefined).map((l) => l.platform),
  );

  const handleConfirm = () => {
    if (!pendingPlatformName || !pendingUrl.trim()) return;

    const platform = ALL_SOCIAL_PLATFORMS.find(
      (p) => p.value === pendingPlatformName,
    );
    const isValid = platform?.validateUrl(pendingUrl.trim()) ?? false;

    if (!isValid) {
      setUrlError(
        `Please enter a valid ${platform?.label} URL (e.g. ${platform?.placeholder})`,
      );
      return;
    }

    setUrlError(null);
    const idx = fields.findIndex((f) => f.platform === pendingPlatformName);
    if (idx !== -1)
      update(idx, { platform: pendingPlatformName, url: pendingUrl.trim() });
    setPendingPlatformName(null);
    setPendingUrl('');
    setOpen(false);
  };

  const handleCancel = () => {
    setPendingPlatformName(null);
    setPendingUrl('');
    setUrlError(null);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) handleCancel();
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <Plus size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="center"
        collisionPadding={8}
        side="top"
        sideOffset={4}
      >
        {pendingPlatformName ? (
          (() => {
            const platform = ALL_SOCIAL_PLATFORMS.find(
              (p) => p.value === pendingPlatformName,
            );
            return (
              <div className="space-y-3 p-4">
                <p className="text-sm font-medium">{platform?.label} link</p>
                <Input
                  type="url"
                  placeholder={platform?.placeholder}
                  value={pendingUrl}
                  onChange={(e) => setPendingUrl(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
                {urlError && (
                  <p className="text-destructive text-xs">{urlError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={!pendingUrl.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Back
                  </Button>
                </div>
              </div>
            );
          })()
        ) : (
          <MenuSocialIcon
            activePlatformTypes={activePlatformTypes}
            setPendingType={setPendingPlatformName}
            setPendingUrl={setPendingUrl}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
