import { useClearServerMetadata } from '@/hooks/useClearServerMetadata';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const PrivateRouteDocumentMetadata = ({ title }: { title: string }) => {
  useClearServerMetadata();
  useDocumentTitle(title);

  return <meta name="robots" content="noindex, nofollow" />;
};
