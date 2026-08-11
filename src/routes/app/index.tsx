import UserProfile from '@/features/profile/UserProfile';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/')({
  component: AppProfilePage,
});

function AppProfilePage() {
  return <UserProfile lensHandle="app" />;
}
