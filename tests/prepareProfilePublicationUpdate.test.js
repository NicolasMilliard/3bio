import { expect, test } from 'bun:test';
import { MetadataAttributeType } from '@lens-protocol/react';

import { THREEBIO_ATTRIBUTE_KEY } from '../src/constants/attributes.ts';
import { prepareProfilePublicationUpdate } from '../src/features/privacy/services/prepareProfilePublicationUpdate.ts';

const ACCOUNT_ADDRESS = '0x1111111111111111111111111111111111111111';
const SESSION_CLIENT = {};
const ACL = {
  template: 'lens_account',
  lensAccount: ACCOUNT_ADDRESS,
  chainId: 232,
};

const ok = (value) => ({
  error: undefined,
  isErr: () => false,
  isOk: () => true,
  value,
});

const err = (error) => ({
  error,
  isErr: () => true,
  isOk: () => false,
  value: undefined,
});

const threeBioAttribute = (value) => ({
  type: MetadataAttributeType.Json,
  key: THREEBIO_ATTRIBUTE_KEY,
  value: JSON.stringify(value),
});

const account = ({
  address = ACCOUNT_ADDRESS,
  attributes = [],
} = {}) => ({
  address,
  metadata: {
    name: 'Native name',
    bio: 'Native bio',
    picture: 'https://api.grove.storage/native-avatar',
    attributes: [
      {
        type: MetadataAttributeType.String,
        key: 'native-key',
        value: 'keep-me',
      },
      ...attributes,
    ],
  },
});

const prepare = ({
  latestAccount = account(),
  fetchResult,
  status = 'opted-out',
} = {}) => {
  const uploads = [];
  const result = prepareProfilePublicationUpdate({
    accountAddress: ACCOUNT_ADDRESS,
    acl: ACL,
    sessionClient: SESSION_CLIENT,
    status,
    updatedAt: '2026-08-17T12:00:00.000Z',
    dependencies: {
      fetchAccount: async () => fetchResult ?? ok(latestAccount),
      uploadAsJson: async (data, options) => {
        uploads.push({ data, options });
        return {
          uri: 'lens://new-metadata',
          storageKey: 'new-metadata',
          gatewayUrl: 'https://api.grove.storage/new-metadata',
        };
      },
    },
  });

  return { result, uploads };
};

test('opt-out preserves current 3bio and unrelated Lens metadata', async () => {
  const { result, uploads } = prepare({
    latestAccount: account({
      attributes: [
        threeBioAttribute({
          schemaVersion: 1,
          updatedAt: '2026-08-17T10:00:00.000Z',
          profile: {
            name: '3bio name',
            avatar: 'https://api.grove.storage/avatar-key',
          },
          publication: { status: 'public' },
        }),
      ],
    }),
  });
  const prepared = await result;

  expect(prepared.ok).toBe(true);
  expect(prepared.nextThreeBioMetadata).toMatchObject({
    profile: {
      name: '3bio name',
      avatar: 'https://api.grove.storage/avatar-key',
    },
    publication: { status: 'opted-out' },
  });
  expect(prepared.metadataResource).toEqual({
    uri: 'lens://new-metadata',
    storageKey: 'new-metadata',
    gatewayUrl: 'https://api.grove.storage/new-metadata',
  });
  expect(prepared.referenceKeys).toEqual([
    'avatar-key',
    'native-avatar',
  ]);
  expect(uploads).toHaveLength(1);
  expect(uploads[0].options).toEqual({ acl: ACL });
  expect(uploads[0].data.lens.name).toBe('Native name');
  expect(
    uploads[0].data.lens.attributes.find(
      ({ key }) => key === 'native-key',
    )?.value,
  ).toBe('keep-me');
});

test('deletion uploads only a durable 3bio marker and preserves native Lens fields', async () => {
  const { result, uploads } = prepare({
    status: 'deleted',
    latestAccount: account({
      attributes: [
        threeBioAttribute({
          schemaVersion: 1,
          updatedAt: '2026-08-17T10:00:00.000Z',
          profile: { name: 'Remove me' },
          theme: {
            name: 'classic',
            displayStatistics: true,
            displayBranding: true,
          },
        }),
      ],
    }),
  });
  const prepared = await result;

  expect(prepared.ok).toBe(true);
  expect(prepared.nextThreeBioMetadata).toEqual({
    schemaVersion: 1,
    updatedAt: '2026-08-17T12:00:00.000Z',
    publication: { status: 'deleted' },
  });
  expect(prepared.referenceKeys).toEqual(['native-avatar']);
  expect(uploads[0].data.lens.name).toBe('Native name');
  expect(uploads[0].data.lens.bio).toBe('Native bio');

  const persistedAttribute = uploads[0].data.lens.attributes.find(
    ({ key }) => key === THREEBIO_ATTRIBUTE_KEY,
  );
  expect(JSON.parse(persistedAttribute.value)).toEqual(
    prepared.nextThreeBioMetadata,
  );
});

test('publication preparation fails closed before uploading', async () => {
  const fetchError = new Error('offline');
  const failedFetch = prepare({ fetchResult: err(fetchError) });
  expect(await failedFetch.result).toEqual({
    ok: false,
    failure: { kind: 'latest-account-fetch-failed', error: fetchError },
  });
  expect(failedFetch.uploads).toHaveLength(0);

  const missing = prepare({ fetchResult: ok(null) });
  expect(await missing.result).toEqual({
    ok: false,
    failure: { kind: 'account-not-found' },
  });
  expect(missing.uploads).toHaveLength(0);

  const mismatch = prepare({
    latestAccount: account({
      address: '0x2222222222222222222222222222222222222222',
    }),
  });
  expect(await mismatch.result).toEqual({
    ok: false,
    failure: { kind: 'account-mismatch' },
  });
  expect(mismatch.uploads).toHaveLength(0);

  const future = prepare({
    latestAccount: account({
      attributes: [
        threeBioAttribute({
          schemaVersion: 999,
          updatedAt: '2026-08-17T10:00:00.000Z',
          publication: { status: 'future-private-state' },
        }),
      ],
    }),
  });
  expect(await future.result).toEqual({
    ok: false,
    failure: { kind: 'unsupported-schema-version' },
  });
  expect(future.uploads).toHaveLength(0);
});
