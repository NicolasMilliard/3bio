import {
  useAccount,
  useAccountStats,
  useAuthenticatedUser,
} from '@lens-protocol/react';

export const useEditorAccount = () => {
  const { data: authenticatedUser } = useAuthenticatedUser();

  const address = authenticatedUser?.address ?? '';

  const { data: account, loading, error } = useAccount({ address });

  const { data: stats } = useAccountStats({
    account: account?.address ?? '',
  });

  return {
    account,
    stats,
    loading,
    error,
  };
};
