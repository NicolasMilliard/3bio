import { HOME_TITLE } from '@/features/profile/documentMetadata';
import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = title;

    return () => {
      document.title = HOME_TITLE;
    };
  }, [title]);
};
