import {
  EyeOff,
  FileX2,
  Globe2,
  Images,
  Info,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
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
  confirmVariant?: 'default' | 'destructive';
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
  confirmVariant = variant === 'destructive' ? 'destructive' : 'default',
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
          className="w-full sm:w-auto"
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
            variant={confirmVariant}
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
  const PublicationIcon =
    publicationStatus === 'public'
      ? Globe2
      : publicationStatus === 'opted-out'
        ? EyeOff
        : FileX2;

  return (
    <Card
      aria-labelledby={titleId}
      className={cn(
        'border-border/70 bg-card gap-0 border py-0 ring-0',
        className,
      )}
    >
      <CardHeader className="border-border/70 bg-secondary/55 relative overflow-hidden border-b p-6 sm:p-7">
        <div
          aria-hidden="true"
          className="bg-accent/35 pointer-events-none absolute -top-12 -right-10 size-32 rounded-full blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>
              <h2 id={titleId} className="text-foreground text-2xl font-bold">
                Privacy &amp; data
              </h2>
            </CardTitle>
            <CardDescription className="text-foreground/75 max-w-2xl">
              Control your 3bio page visibility and app-managed Grove uploads.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-6">
        <section
          aria-labelledby={`${titleId}-visibility`}
          className="border-primary/15 bg-primary/[0.035] relative overflow-hidden rounded-xl border p-5 sm:p-6"
        >
          <div
            className="bg-accent/30 pointer-events-none absolute -top-10 -right-10 size-32 rounded-full blur-2xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <PublicationIcon className="size-4" aria-hidden="true" />
                Profile visibility
              </div>
              <Badge
                variant={publicationStatus === 'public' ? 'default' : 'outline'}
                className="shadow-xs"
              >
                {status.badge}
              </Badge>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <h3
                  id={`${titleId}-visibility`}
                  className="text-foreground text-xl font-semibold"
                >
                  Publication
                </h3>
                <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  {status.description}
                </p>
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
            </div>
          </div>
        </section>

        <section
          aria-labelledby={`${titleId}-management`}
          className="space-y-3"
        >
          <div className="px-1 pb-1">
            <h3
              id={`${titleId}-management`}
              className="text-foreground text-sm font-semibold"
            >
              Data management
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Review the files and settings managed by 3bio.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <section
              aria-labelledby={`${titleId}-cleanup`}
              className="border-border/80 bg-background flex flex-col rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Images className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h4 id={`${titleId}-cleanup`} className="font-semibold">
                    Grove cleanup
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {resourceLabel}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-5">
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
                  confirmVariant="destructive"
                />
              </div>
            </section>

            <section
              aria-labelledby={`${titleId}-deletion`}
              className="border-destructive/20 bg-destructive/[0.035] flex flex-col rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <div className="bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Trash2 className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h4 id={`${titleId}-deletion`} className="font-semibold">
                    Delete current 3bio data
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Clear the settings currently used by 3bio and remove
                    eligible uploads on a best-effort basis.
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-5">
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
              </div>
            </section>
          </div>
        </section>
      </CardContent>

      <CardFooter className="border-border/70 bg-muted/25 items-start gap-2.5 border-t px-4 py-4 sm:px-6">
        <Info
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        <p className="text-muted-foreground max-w-4xl text-xs leading-relaxed">
          These controls affect 3bio&apos;s current view and Grove upload data.
          Pending uploads and Grove metadata documents are retained. Lens and
          on-chain history, intermediary caches, and third-party copies cannot
          be erased.
        </p>
      </CardFooter>
    </Card>
  );
};
