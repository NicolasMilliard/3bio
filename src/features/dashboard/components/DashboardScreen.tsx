import { Button, Spinner, Text } from '@/components/ui';
import { DashboardCard } from '@/features/dashboard/components';
import { useEditorAccount } from '@/features/editor/hooks';
import { PrivacyDataCard } from '@/features/privacy/components';
import { usePrivacyData } from '@/features/privacy/hooks';
import type { Account } from '@lens-protocol/react';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

const privacyCardClassName =
  'animate-[blurFadeIn_0.5s_ease-out_0.3s_forwards] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 md:col-span-2';

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
      className={privacyCardClassName}
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
        className={privacyCardClassName}
      >
        <div
          role="status"
          aria-live="polite"
          className="text-muted-foreground flex items-center gap-2 px-6"
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
        className={privacyCardClassName}
        footer={
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        <p role="alert" className="text-destructive px-6">
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
    <div className="mx-auto mt-30 flex w-full max-w-6xl flex-col gap-8 px-4">
      <Text variant="h1" className="text-foreground">
        Dashboard
      </Text>
      <section className="mb-30 grid gap-4 md:grid-cols-2">
        <DashboardCard
          title="Edit your Profile"
          description="Update your identity, links and public data."
          footer={
            <Button asChild>
              <Link to="/app/edit">Edit profile</Link>
            </Button>
          }
          className="animate-[blurFadeIn_0.5s_ease-out_forwards] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
        />
        <DashboardCard
          title="Statistics"
          description="Consult your activity and usage."
          footer={<Button disabled>Coming soon</Button>}
          className="animate-[blurFadeIn_0.5s_ease-out_0.15s_forwards] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
        />
        <DashboardPrivacyCard
          key={privacyRequestKey}
          onRetry={() => setPrivacyRequestKey((key) => key + 1)}
        />
      </section>
    </div>
  );
};
