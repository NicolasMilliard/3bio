import UserProfile from '@/features/profile/UserProfile';
// Uncomment this import and the prop below to use local profile data.
import { useOfflineProfileData } from '@/features/profile/offlineProfileData';
import { createFileRoute, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/$pageId/')({
  component: PageContent,
});

function PageContent() {
  const { pageId } = useParams({ from: '/$pageId/' });

  const lensHandle = pageId.toLowerCase();

  return (
    <UserProfile
      lensHandle={lensHandle}
      useProfileData={useOfflineProfileData}
    />
  );
}
