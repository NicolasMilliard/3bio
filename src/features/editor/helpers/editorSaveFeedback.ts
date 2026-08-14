import type { AccountSessionBindingState } from '@/features/auth/sessionBinding';
import type { MetadataUpdateFailure } from '../services/submitMetadataUpdate';
import type { PrepareEditorMetadataFailure } from '../services/prepareEditorMetadataUpdate';
import { getSaveErrorFeedback } from './saveErrorFeedback';

export type EditorSaveFeedback = {
  title: string;
  description: string;
};

const SESSION_ERROR_FEEDBACK = {
  pending: {
    title: 'Wallet connection is updating',
    description: 'Wait for your wallet to finish reconnecting, then save.',
  },
  'wallet-disconnected': {
    title: 'Wallet disconnected',
    description:
      'Reconnect the wallet that manages this Lens profile before saving.',
  },
  'session-missing': {
    title: 'Lens session expired',
    description: 'Sign in to your Lens profile again before saving.',
  },
  mismatch: {
    title: 'Different wallet connected',
    description: 'Switch back to the wallet that manages this Lens profile.',
  },
  'account-mismatch': {
    title: 'Lens profile changed',
    description: 'Switch back to this Lens profile before saving its draft.',
  },
  bound: {
    title: 'Wallet session changed',
    description: 'Check your wallet connection and try again.',
  },
} satisfies Record<AccountSessionBindingState, EditorSaveFeedback>;

export const getSessionErrorFeedback = (
  state: AccountSessionBindingState,
): EditorSaveFeedback => SESSION_ERROR_FEEDBACK[state];

export const getMetadataUpdateFailureFeedback = (
  failure: MetadataUpdateFailure,
): EditorSaveFeedback => {
  switch (failure.kind) {
    case 'session':
      return getSessionErrorFeedback(failure.state);
    case 'session-changed':
      return {
        title: 'Lens session changed',
        description: 'Your profile changed before the transaction was sent.',
      };
    case 'network-required':
      return {
        title: 'Lens network required',
        description: failure.description,
      };
    case 'transaction-failed':
      return {
        title: 'Transaction failed',
        description: failure.description,
      };
    case 'confirmation-failed':
      return getSaveErrorFeedback('confirming-transaction');
  }
};

export const getMetadataPreparationFailureFeedback = (
  failure: PrepareEditorMetadataFailure,
): EditorSaveFeedback => {
  switch (failure.kind) {
    case 'latest-account-fetch-failed':
      return {
        title: 'Could not load the latest profile',
        description:
          'Your draft is still here. Check your connection and try again.',
      };
    case 'account-not-found':
      return {
        title: 'Profile no longer available',
        description:
          'Your draft was not uploaded. Refresh the page and try again.',
      };
    case 'account-mismatch':
      return {
        title: 'Lens profile changed',
        description:
          'Your draft was not uploaded. Switch back to this profile and try again.',
      };
    case 'unsupported-schema-version':
      return {
        title: 'Profile metadata is from a newer version',
        description: 'Update 3bio before saving this profile.',
      };
  }
};
