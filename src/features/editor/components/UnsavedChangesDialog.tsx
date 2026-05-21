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
  onCancel: () => void;
  onConfirm: () => void;
};

export const UnsavedChangesDialog = ({
  open,
  onCancel,
  onConfirm,
}: UnsavedChangesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>

          <DialogDescription>
            You have unsaved changes. Are you sure you want to leave?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button variant="destructive" onClick={onConfirm}>
            Discard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
