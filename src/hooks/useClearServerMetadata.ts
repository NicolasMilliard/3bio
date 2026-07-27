import { useEffect } from 'react';

export const useClearServerMetadata = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    document.head
      .querySelectorAll('[data-3bio-server-metadata]')
      .forEach((element) => element.remove());
  }, [enabled]);
};
