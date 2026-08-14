import { expect, test } from 'bun:test';
import { MetadataAttributeType } from '@lens-protocol/react';

import { THREEBIO_ATTRIBUTE_KEY } from '../src/constants/attributes.ts';
import { THREE_BIO_DEFAULT_THEME } from '../src/constants/themes.ts';
import { prepareEditorMetadataUpdate } from '../src/features/editor/services/prepareEditorMetadataUpdate.ts';

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

const values = {
  _imageValidation: {
    avatar: false,
    coverPicture: false,
    linksPanelBackground: false,
  },
  avatar: { preview: null },
  coverPicture: { preview: null },
  linksPanelBackground: { preview: null },
  name: 'Draft name',
  bio: 'Draft bio',
  socialLinks: [],
  links: [],
  theme: THREE_BIO_DEFAULT_THEME,
  displayStatistics: true,
  displayBranding: true,
};

const imageUris = {
  avatarUri: undefined,
  coverPictureUri: undefined,
  linksPanelBackgroundUri: undefined,
};

const threeBioAttribute = (metadata) => ({
  type: MetadataAttributeType.Json,
  key: THREEBIO_ATTRIBUTE_KEY,
  value: JSON.stringify(metadata),
});

const account = ({
  address = ACCOUNT_ADDRESS,
  attributes = [],
  name = 'Native name',
} = {}) => ({
  address,
  metadata: {
    name,
    attributes,
  },
});

const prepare = ({
  cacheEntry = null,
  dirtyFields = {
    name: false,
    bio: true,
    socialLinks: false,
    links: false,
    theme: false,
    displayStatistics: false,
    displayBranding: false,
  },
  latestAccount = account(),
  fetchResult,
  draftValues = values,
  uploadAsJson,
} = {}) => {
  let uploads = 0;
  const upload =
    uploadAsJson ??
    (async () => {
      uploads += 1;
      return { uri: 'lens://metadata/new' };
    });

  return {
    getUploads: () => uploads,
    result: prepareEditorMetadataUpdate({
      accountAddress: ACCOUNT_ADDRESS,
      acl: ACL,
      cacheEntry,
      dirtyFields,
      imageUris,
      sessionClient: SESSION_CLIENT,
      values: draftValues,
      dependencies: {
        fetchAccount: async () => fetchResult ?? ok(latestAccount),
        uploadAsJson: upload,
      },
    }),
  };
};

test('prepares metadata from the latest account while preserving clean remote fields', async () => {
  const latestAccount = account({
    attributes: [
      threeBioAttribute({
        profile: { name: 'Remote name', bio: 'Remote bio' },
        theme: {
          name: 'midnight',
          displayStatistics: false,
          displayBranding: false,
        },
      }),
    ],
  });
  const uploaded = [];
  const { result } = prepare({
    latestAccount,
    uploadAsJson: async (data, options) => {
      uploaded.push({ data, options });
      return { uri: 'lens://metadata/latest' };
    },
  });

  const prepared = await result;

  expect(prepared.ok).toBe(true);
  expect(prepared.nextThreeBioMetadata.profile).toMatchObject({
    name: 'Remote name',
    bio: 'Draft bio',
  });
  expect(prepared.nextThreeBioMetadata.theme).toMatchObject({
    name: 'midnight',
    displayStatistics: false,
    displayBranding: false,
  });
  expect(prepared.metadataUri).toBe('lens://metadata/latest');
  expect(uploaded).toHaveLength(1);
  expect(uploaded[0].options).toEqual({ acl: ACL });
  expect(prepared.cacheEntry.accountAddress).toBe(
    ACCOUNT_ADDRESS.toLowerCase(),
  );
});

test('reuses a matching account-scoped metadata cache entry', async () => {
  const latestAccount = account();
  const first = prepare({ latestAccount });
  const firstResult = await first.result;

  expect(firstResult.ok).toBe(true);
  expect(first.getUploads()).toBe(1);

  const retry = prepare({
    latestAccount,
    cacheEntry: firstResult.cacheEntry,
  });
  const retryResult = await retry.result;

  expect(retryResult.ok).toBe(true);
  expect(retryResult.metadataUri).toBe(firstResult.metadataUri);
  expect(retry.getUploads()).toBe(0);

  const anotherAccountCache = {
    ...firstResult.cacheEntry,
    accountAddress: '0x2222222222222222222222222222222222222222',
  };
  const scopedRetry = prepare({
    latestAccount,
    cacheEntry: anotherAccountCache,
  });

  expect((await scopedRetry.result).ok).toBe(true);
  expect(scopedRetry.getUploads()).toBe(1);

  const remoteChanged = prepare({
    latestAccount: account({ name: 'Updated native name' }),
    cacheEntry: firstResult.cacheEntry,
  });
  expect((await remoteChanged.result).ok).toBe(true);
  expect(remoteChanged.getUploads()).toBe(1);

  const draftChanged = prepare({
    latestAccount,
    cacheEntry: firstResult.cacheEntry,
    draftValues: { ...values, bio: 'Changed draft bio' },
  });
  expect((await draftChanged.result).ok).toBe(true);
  expect(draftChanged.getUploads()).toBe(1);
});

test('returns a distinct latest-account fetch failure', async () => {
  const fetchError = new Error('offline');
  const { result } = prepare({ fetchResult: err(fetchError) });

  expect(await result).toEqual({
    ok: false,
    failure: { kind: 'latest-account-fetch-failed', error: fetchError },
  });
});

test('rejects missing and mismatched latest accounts before uploading', async () => {
  const missing = prepare({ fetchResult: ok(null) });
  expect(await missing.result).toEqual({
    ok: false,
    failure: { kind: 'account-not-found' },
  });
  expect(missing.getUploads()).toBe(0);

  const mismatch = prepare({
    latestAccount: account({
      address: '0x2222222222222222222222222222222222222222',
    }),
  });
  expect(await mismatch.result).toEqual({
    ok: false,
    failure: { kind: 'account-mismatch' },
  });
  expect(mismatch.getUploads()).toBe(0);
});

test('blocks unsupported future metadata before merging or uploading', async () => {
  const future = prepare({
    latestAccount: account({
      attributes: [
        threeBioAttribute({
          schemaVersion: 999,
          updatedAt: '2026-08-12T10:00:00.000Z',
          profile: { name: 'Future name' },
        }),
      ],
    }),
  });

  expect(await future.result).toEqual({
    ok: false,
    failure: { kind: 'unsupported-schema-version' },
  });
  expect(future.getUploads()).toBe(0);
});
