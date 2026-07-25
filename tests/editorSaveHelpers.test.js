import { expect, test } from 'bun:test';

import { getTransactionFailureReason } from '../src/features/editor/helpers/getTransactionFailureReason.ts';
import { toLinkAttributes } from '../src/features/editor/helpers/metadataAttributes.ts';

test('only TransactionWillFail is treated as an immediate Lens failure', () => {
  expect(
    getTransactionFailureReason({
      __typename: 'TransactionWillFail',
      reason: 'Simulation reverted',
    }),
  ).toBe('Simulation reverted');

  expect(
    getTransactionFailureReason({
      __typename: 'SponsoredTransactionRequest',
      reason: 'Sponsored by the app',
    }),
  ).toBeNull();

  expect(
    getTransactionFailureReason({
      __typename: 'SelfFundedTransactionRequest',
      reason: 'Sponsorship unavailable',
    }),
  ).toBeNull();

  expect(
    getTransactionFailureReason({
      __typename: 'SetAccountMetadataResponse',
    }),
  ).toBeNull();
});

test('saved links on the same hostname receive distinct metadata keys', () => {
  const attributes = toLinkAttributes([
    'https://example.com/first',
    'https://example.com/second',
  ]);

  expect(attributes.map(({ key }) => key)).toEqual([
    'links.example.com.0',
    'links.example.com.1',
  ]);
  expect(new Set(attributes.map(({ key }) => key)).size).toBe(2);
});
