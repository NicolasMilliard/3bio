import { useId, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Spinner,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ThreeBioPublicationStatus } from '@/schemas/threeBioMetadata.schema';

export type PrivacyDataAction =
  'make-public' | 'opt-out' | 'delete-data' | 'cleanup';

export type PrivacyDataCardProps = {
  publicationStatus: ThreeBioPublicationStatus;
  busyAction?: PrivacyDataAction | null;
  cleanupAvailable?: boolean;
  managedResourceCount: number;
  onMakePublic: () => void | Promise<void>;
  onOptOut: () => void | Promise<void>;
  onDeleteData: () => void | Promise<void>;
  onCleanup: () => void | Promise<void>;
  className?: string;
};

type ConfirmationDialogProps = {
  action: PrivacyDataAction;
  busyAction: PrivacyDataAction | null;
  triggerLabel: string;
  busyLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'destructive';
};

const statusDetails: Record<
  ThreeBioPublicationStatus,
  { badge: string; description: string }
> = {
  public: {
    badge: 'Public',
    description: 'Your 3bio page is visible to anyone with its URL.',
  },
  'opted-out': {
    badge: 'Hidden',
    description:
      'Your 3bio page is hidden, while your current settings are preserved.',
  },
  deleted: {
    badge: 'Data cleared',
    description:
      'Your current 3bio settings are cleared. Historical records may still exist outside 3bio.',
  },
};

const ConfirmationDialog = ({
  action,
  busyAction,
  triggerLabel,
  busyLabel,
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled = false,
  variant = 'outline',
}: ConfirmationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [invocationPending, setInvocationPending] = useState(false);
  const isBusy = busyAction === action || invocationPending;
  const hasBusyAction = busyAction !== null || invocationPending;

  const confirm = () => {
    if (hasBusyAction) return;

    setInvocationPending(true);

    let result: void | Promise<void>;

    try {
      result = onConfirm();
    } catch {
      setInvocationPending(false);
      setOpen(false);
      return;
    }

    void Promise.resolve(result)
      .catch(() => undefined)
      .finally(() => {
        setInvocationPending(false);
        setOpen(false);
      });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!hasBusyAction) setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          disabled={disabled || hasBusyAction}
          aria-busy={isBusy || undefined}
        >
          {isBusy ? <Spinner aria-hidden="true" /> : null}
          {isBusy ? busyLabel : triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent showCloseButton={!hasBusyAction}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={hasBusyAction}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={confirm}
            aria-disabled={hasBusyAction}
            aria-busy={isBusy || undefined}
            className={hasBusyAction ? 'pointer-events-none opacity-50' : ''}
          >
            {isBusy ? <Spinner aria-hidden="true" /> : null}
            <span aria-live="polite">{isBusy ? busyLabel : confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PrivacyDataCard = ({
  publicationStatus,
  busyAction = null,
  cleanupAvailable = true,
  managedResourceCount,
  onMakePublic,
  onOptOut,
  onDeleteData,
  onCleanup,
  className,
}: PrivacyDataCardProps) => {
  const titleId = useId();
  const resourceCount = Math.max(0, Math.trunc(managedResourceCount));
  const resourceLabel = cleanupAvailable
    ? `${resourceCount} image cleanup ${resourceCount === 1 ? 'candidate' : 'candidates'} recorded in this browser`
    : "This browser's Grove cleanup record is unavailable.";
  const status = statusDetails[publicationStatus];

  return (
    <Card
      aria-labelledby={titleId}
      className={cn('bg-muted/40 ring-0', className)}
    >
      <CardHeader>
        <CardTitle>
          <h2 id={titleId} className="text-foreground text-2xl font-bold">
            Privacy &amp; data
          </h2>
        </CardTitle>
        <CardDescription className="text-foreground">
          Control your 3bio page visibility and app-managed Grove uploads.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <section
          aria-labelledby={`${titleId}-visibility`}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 id={`${titleId}-visibility`} className="font-medium">
                Publication
              </h3>
              <p className="text-muted-foreground">{status.description}</p>
            </div>
            <Badge
              variant={publicationStatus === 'public' ? 'default' : 'outline'}
            >
              {status.badge}
            </Badge>
          </div>

          {publicationStatus === 'public' ? (
            <ConfirmationDialog
              action="opt-out"
              busyAction={busyAction}
              triggerLabel="Hide profile"
              busyLabel="Hiding profile..."
              title="Hide your 3bio profile?"
              description="Opting out hides your public 3bio page but preserves your current settings so you can make it public again later. It does not erase Lens or on-chain history, caches, or copies retained by third parties."
              confirmLabel="Hide profile"
              onConfirm={onOptOut}
            />
          ) : (
            <ConfirmationDialog
              action="make-public"
              busyAction={busyAction}
              triggerLabel="Make profile public"
              busyLabel="Publishing profile..."
              title="Make your 3bio profile public?"
              description="This allows a public 3bio page for this Lens profile. If you previously deleted its settings, add and save new profile details in the editor afterward."
              confirmLabel="Make public"
              onConfirm={onMakePublic}
            />
          )}
        </section>

        <section
          aria-labelledby={`${titleId}-deletion`}
          className="border-border space-y-3 border-t pt-6"
        >
          <div className="space-y-1">
            <h3 id={`${titleId}-deletion`} className="font-medium">
              Delete current 3bio data
            </h3>
            <p className="text-muted-foreground">
              Clear the settings currently used by 3bio and remove eligible
              uploads on a best-effort basis.
            </p>
          </div>
          <ConfirmationDialog
            action="delete-data"
            busyAction={busyAction}
            triggerLabel={
              publicationStatus === 'deleted'
                ? 'Current data cleared'
                : 'Delete current data'
            }
            busyLabel="Deleting data..."
            title="Delete current 3bio data?"
            description="This clears the current 3bio settings and then attempts to delete only Grove images recorded as app-managed. Metadata documents are retained. Cleanup is best effort and may require one wallet signature per image. Lens and on-chain history, caches, and third-party copies cannot be erased."
            confirmLabel="Delete current data"
            onConfirm={onDeleteData}
            disabled={publicationStatus === 'deleted'}
            variant="destructive"
          />
        </section>

        <section
          aria-labelledby={`${titleId}-cleanup`}
          className="border-border space-y-3 border-t pt-6"
        >
          <div className="space-y-1">
            <h3 id={`${titleId}-cleanup`} className="font-medium">
              Grove cleanup
            </h3>
            <p className="text-muted-foreground">{resourceLabel}</p>
          </div>
          <ConfirmationDialog
            action="cleanup"
            busyAction={busyAction}
            triggerLabel={
              !cleanupAvailable
                ? 'Cleanup unavailable'
                : resourceCount === 1
                  ? 'Clean up 1 image'
                  : `Clean up ${resourceCount} images`
            }
            busyLabel="Cleaning up images..."
            title="Clean up app-managed Grove images?"
            description={`3bio will attempt to delete ${resourceCount} Grove ${resourceCount === 1 ? 'image' : 'images'} recorded as app-managed. Metadata documents and other Grove content are retained. Cleanup is best effort, may require one wallet signature per image, and cannot erase Lens or on-chain history, caches, or third-party copies.`}
            confirmLabel="Start cleanup"
            onConfirm={onCleanup}
            disabled={!cleanupAvailable || resourceCount === 0}
            variant="destructive"
          />
        </section>
      </CardContent>

      <CardFooter>
        <p className="text-muted-foreground text-xs">
          These controls affect 3bio&apos;s current view and app-managed data.
          Pending uploads and Grove metadata documents are retained. Lens and
          on-chain history, intermediary caches, and third-party copies cannot
          be erased.
        </p>
      </CardFooter>
    </Card>
  );
};
