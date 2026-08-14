import { describe, expect, test } from 'bun:test';

import {
  getMetadataPreparationFailureFeedback,
  getMetadataUpdateFailureFeedback,
  getSessionErrorFeedback,
} from '../src/features/editor/helpers/editorSaveFeedback.ts';

describe('getSessionErrorFeedback', () => {
  const cases = [
    [
      'pending',
      'Wallet connection is updating',
      'Wait for your wallet to finish reconnecting, then save.',
    ],
    [
      'wallet-disconnected',
      'Wallet disconnected',
      'Reconnect the wallet that manages this Lens profile before saving.',
    ],
    [
      'session-missing',
      'Lens session expired',
      'Sign in to your Lens profile again before saving.',
    ],
    [
      'mismatch',
      'Different wallet connected',
      'Switch back to the wallet that manages this Lens profile.',
    ],
    [
      'account-mismatch',
      'Lens profile changed',
      'Switch back to this Lens profile before saving its draft.',
    ],
    [
      'bound',
      'Wallet session changed',
      'Check your wallet connection and try again.',
    ],
  ];

  test.each(cases)('maps the %s state', (state, title, description) => {
    expect(getSessionErrorFeedback(state)).toEqual({ title, description });
  });
});

describe('getMetadataPreparationFailureFeedback', () => {
  const cases = [
    [
      { kind: 'latest-account-fetch-failed', error: new Error('offline') },
      'Could not load the latest profile',
      'Your draft is still here. Check your connection and try again.',
    ],
    [
      { kind: 'account-not-found' },
      'Profile no longer available',
      'Your draft was not uploaded. Refresh the page and try again.',
    ],
    [
      { kind: 'account-mismatch' },
      'Lens profile changed',
      'Your draft was not uploaded. Switch back to this profile and try again.',
    ],
    [
      { kind: 'unsupported-schema-version' },
      'Profile metadata is from a newer version',
      'Update 3bio before saving this profile.',
    ],
  ];

  test.each(cases)('maps $kind', (failure, title, description) => {
    expect(getMetadataPreparationFailureFeedback(failure)).toEqual({
      title,
      description,
    });
  });
});

describe('getMetadataUpdateFailureFeedback', () => {
  test('maps session failures through the session feedback', () => {
    expect(
      getMetadataUpdateFailureFeedback({
        kind: 'session',
        state: 'wallet-disconnected',
      }),
    ).toEqual({
      title: 'Wallet disconnected',
      description:
        'Reconnect the wallet that manages this Lens profile before saving.',
    });
  });

  test('maps a changed session', () => {
    expect(
      getMetadataUpdateFailureFeedback({ kind: 'session-changed' }),
    ).toEqual({
      title: 'Lens session changed',
      description: 'Your profile changed before the transaction was sent.',
    });
  });

  test('preserves the network failure description', () => {
    expect(
      getMetadataUpdateFailureFeedback({
        kind: 'network-required',
        description: 'Switch back to Lens.',
      }),
    ).toEqual({
      title: 'Lens network required',
      description: 'Switch back to Lens.',
    });
  });

  test('preserves the transaction failure description', () => {
    expect(
      getMetadataUpdateFailureFeedback({
        kind: 'transaction-failed',
        description: 'The transaction was rejected.',
      }),
    ).toEqual({
      title: 'Transaction failed',
      description: 'The transaction was rejected.',
    });
  });

  test('maps confirmation failures without exposing the raw error', () => {
    const rawError = new Error('RPC unavailable');

    expect(
      getMetadataUpdateFailureFeedback({
        kind: 'confirmation-failed',
        error: rawError,
      }),
    ).toEqual({
      title: 'Profile confirmation interrupted',
      description:
        'The transaction was submitted, but Lens could not confirm it. Check your public profile before trying again.',
    });
  });
});
