import {
  useLogin,
  type AccountAvailable,
  type EvmAddress,
} from '@lens-protocol/react';
import { signMessageWith } from '@lens-protocol/react/viem';
import { getWalletClient } from '@wagmi/core';
import { useConfig, useConnection } from 'wagmi';

export type LensLoginOutcome =
  { success: true } | { success: false; message: string };

const getLoginErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (
    message.includes('reject') ||
    message.includes('denied') ||
    message.includes('declined') ||
    message.includes('cancel')
  ) {
    return 'The signature request was cancelled. Approve it in your wallet to continue.';
  }

  return 'Lens could not sign you in. Confirm this wallet manages the profile and try again.';
};

export const useLensLogin = () => {
  const config = useConfig();
  const { address, connector } = useConnection();
  const { execute: login } = useLogin();

  return async (item: AccountAvailable): Promise<LensLoginOutcome> => {
    if (!address || !connector) {
      return {
        success: false,
        message: 'Reconnect your wallet before choosing a Lens profile.',
      };
    }

    try {
      const signer = await getWalletClient(config, {
        account: address,
        connector,
      });

      const ownerOrManager =
        signer?.account?.address ?? (address as EvmAddress);
      if (!ownerOrManager) {
        return {
          success: false,
          message: 'Unlock your wallet and try choosing the profile again.',
        };
      }

      const payload =
        item.__typename === 'AccountManaged'
          ? {
              accountManager: {
                account: item.account.address as EvmAddress,
                manager: ownerOrManager as EvmAddress,
              },
            }
          : {
              accountOwner: {
                account: item.account.address as EvmAddress,
                owner: ownerOrManager as EvmAddress,
              },
            };

      const result = await login({
        ...payload,
        signMessage: signMessageWith(signer),
      });

      if (result.isErr()) {
        return {
          success: false,
          message: getLoginErrorMessage(result.error),
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getLoginErrorMessage(error),
      };
    }
  };
};
