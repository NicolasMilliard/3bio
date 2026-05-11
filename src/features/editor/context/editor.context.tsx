import { createContext, useContext } from 'react';

import type { InBioMetadata } from '@/schemas/inBioMetadata.schema';
import type { Account, AccountStats } from '@lens-protocol/react';

type EditorContextValue = {
  account: Account;
  stats?: AccountStats;
  inBioMetadata: InBioMetadata;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider = ({
  value,
  children,
}: {
  value: EditorContextValue;
  children: React.ReactNode;
}) => <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;

export const useEditorContext = () => {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }

  return context;
};
