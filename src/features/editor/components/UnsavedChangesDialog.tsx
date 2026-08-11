import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

type UnsavedChangesDialogProps = {
  open: boolean;
  isSaving?: boolean;
  isCheckingImage?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const UnsavedChangesDialog = ({
  open,
  isSaving = false,
  isCheckingImage = false,
  onCancel,
  onConfirm,
}: UnsavedChangesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSaving
              ? 'Save in progress'
              : isCheckingImage
                ? 'Image check in progress'
                : 'Unsaved changes'}
          </DialogTitle>

          <DialogDescription>
            {isSaving
              ? 'Your profile is still being published. Wait for the save to finish before leaving this page.'
              : isCheckingImage
                ? 'Your image is still being checked. Wait for it to finish before leaving this page.'
                : 'You have unsaved changes. Are you sure you want to leave?'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {isSaving || isCheckingImage ? 'Stay on this page' : 'Cancel'}
          </Button>

          {!isSaving && !isCheckingImage && (
            <Button type="button" variant="destructive" onClick={onConfirm}>
              Discard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
