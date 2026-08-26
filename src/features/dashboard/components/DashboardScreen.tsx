import { Badge, Button, Spinner, Text } from '@/components/ui';
import { DashboardCard } from '@/features/dashboard/components';
import { useEditorAccount } from '@/features/editor/hooks';
import { PrivacyDataCard } from '@/features/privacy/components';
import { usePrivacyData } from '@/features/privacy/hooks';
import type { Account } from '@lens-protocol/react';
import { Link } from '@tanstack/react-router';
import { ChartNoAxesCombined, PencilLine, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const DashboardPrivacyControls = ({ account }: { account: Account }) => {
  const {
    publicationStatus,
    busyAction,
    cleanupAvailable,
    managedResourceCount,
    makePublic,
    optOut,
    deleteData,
    cleanup,
  } = usePrivacyData(account);

  return (
    <PrivacyDataCard
      publicationStatus={publicationStatus}
      busyAction={busyAction}
      cleanupAvailable={cleanupAvailable}
      managedResourceCount={managedResourceCount}
      onMakePublic={makePublic}
      onOptOut={optOut}
      onDeleteData={deleteData}
      onCleanup={cleanup}
    />
  );
};

const DashboardPrivacyCard = ({ onRetry }: { onRetry: () => void }) => {
  const { account, loading, error } = useEditorAccount();

  if (loading) {
    return (
      <DashboardCard
        title="Privacy & data"
        description="Loading your publication and app-managed Grove data."
        icon={<ShieldCheck className="size-5" aria-hidden="true" />}
      >
        <div
          role="status"
          aria-live="polite"
          className="text-muted-foreground flex items-center gap-2"
        >
          <Spinner aria-hidden="true" />
          Loading privacy controls...
        </div>
      </DashboardCard>
    );
  }

  if (error || !account) {
    return (
      <DashboardCard
        title="Privacy & data"
        description="Control your 3bio page visibility and app-managed Grove uploads."
        icon={<ShieldCheck className="size-5" aria-hidden="true" />}
        footer={
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        <p role="alert" className="text-destructive">
          {error
            ? 'Privacy controls could not connect to Lens.'
            : 'The active Lens profile could not be found.'}
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardPrivacyControls
      key={account.address.toLowerCase()}
      account={account}
    />
  );
};

export const DashboardScreen = () => {
  const [privacyRequestKey, setPrivacyRequestKey] = useState(0);

  return (
    <div className="from-secondary/65 via-background to-background relative isolate overflow-hidden bg-linear-to-b">
      <div
        aria-hidden="true"
        className="bg-accent/20 pointer-events-none absolute top-16 right-[8%] size-64 rounded-full blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-30 pb-30">
        <header className="dashboard-enter max-w-2xl">
          <p className="text-primary flex items-center gap-3 text-xs font-black tracking-[0.2em] uppercase">
            <span className="bg-accent size-2.5 rounded-full" />
            Your 3bio workspace
          </p>
          <Text
            variant="h1"
            className="text-foreground mt-4 text-[clamp(2.75rem,5vw,4rem)] leading-[0.98] tracking-[-0.05em]"
          >
            <span className="after:bg-accent relative inline-block after:absolute after:bottom-[0.04em] after:left-0 after:-z-10 after:h-[0.16em] after:w-full after:rounded-full after:content-['']">
              Dashboard
            </span>
          </Text>
          <Text className="text-foreground/75 mt-5 max-w-xl text-base leading-7 sm:text-lg">
            Manage your profile, visibility, and 3bio data from one place.
          </Text>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <DashboardCard
            title="Edit your Profile"
            description="Update your identity, links and public data."
            icon={<PencilLine className="size-5" aria-hidden="true" />}
            footer={
              <Button asChild>
                <Link to="/app/edit">Edit profile</Link>
              </Button>
            }
            className="dashboard-enter dashboard-enter-card-1"
          />
          <DashboardCard
            title="Statistics"
            description="Consult your activity and usage."
            icon={<ChartNoAxesCombined className="size-5" aria-hidden="true" />}
            footer={
              <Badge
                variant="outline"
                className="bg-secondary/70 text-muted-foreground"
              >
                Coming soon
              </Badge>
            }
            className="dashboard-enter dashboard-enter-card-2"
          />
          <div className="dashboard-enter dashboard-enter-privacy md:col-span-2">
            <DashboardPrivacyCard
              key={privacyRequestKey}
              onRetry={() => setPrivacyRequestKey((key) => key + 1)}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
