import UserProfile from '@/features/profile/UserProfile';
import { createFileRoute, redirect, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/$pageId/')({
  beforeLoad: ({ params }) => {
    const normalizedPageId = params.pageId.toLowerCase();

    if (params.pageId !== normalizedPageId) {
      throw redirect({
        to: '/$pageId',
        params: { pageId: normalizedPageId },
        replace: true,
      });
    }
  },
  component: PageContent,
});

function PageContent() {
  const { pageId } = useParams({ from: '/$pageId/' });

  const lensHandle = pageId.toLowerCase();

  return <UserProfile lensHandle={lensHandle} />;
}
