import { expect, test } from 'bun:test';

import { chains } from '@lens-chain/sdk/viem';
import { submitMetadataUpdate } from '../src/features/editor/services/submitMetadataUpdate.ts';

const ACCOUNT_ADDRESS = '0x1111111111111111111111111111111111111111';
const WALLET_ADDRESS = '0x2222222222222222222222222222222222222222';
const OTHER_CHAIN_ID = 1;

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

const authenticatedUser = (authenticationId = 'session-a') => ({
  address: ACCOUNT_ADDRESS,
  authenticationId,
  role: 'ACCOUNT_OWNER',
  signer: WALLET_ADDRESS,
});

const connection = (chainId = chains.mainnet.id) => ({
  address: WALLET_ADDRESS,
  chainId,
  connector: { id: 'test-connector' },
  status: 'connected',
});

const sessionSnapshot = ({
  authenticationId = 'session-a',
  chainId = chains.mainnet.id,
  sessionClient,
} = {}) => ({
  authenticatedUser: authenticatedUser(authenticationId),
  connection: connection(chainId),
  sessionClient,
  state: 'bound',
});

const sessionQueue = (...snapshots) => {
  let index = 0;

  return () => snapshots[Math.min(index++, snapshots.length - 1)];
};

const createDependencies = (overrides = {}) => ({
  getConnection: () => connection(),
  getWalletClient: async () => ({ account: WALLET_ADDRESS }),
  handleOperation: async () => ok('0xhandled'),
  setAccountMetadata: async () =>
    ok({ __typename: 'SponsoredTransactionRequest', hash: '0xsponsored' }),
  switchChain: async () => undefined,
  ...overrides,
});

const submit = ({
  dependencies,
  getCurrentEditorSession,
  onProgress,
}) =>
  submitMetadataUpdate({
    config: {},
    accountAddress: ACCOUNT_ADDRESS,
    metadataUri: 'https://metadata.example/profile.json',
    dependencies,
    getCurrentEditorSession,
    onProgress,
  });

test('a sponsored metadata update skips wallet signing and confirms on its original session', async () => {
  const confirmedHashes = [];
  const progress = [];
  let walletCalls = 0;
  let signingCalls = 0;
  const sessionClient = {
    waitForTransaction: async (hash) => {
      confirmedHashes.push(hash);
      return ok(undefined);
    },
  };
  const dependencies = createDependencies({
    getWalletClient: async () => {
      walletCalls += 1;
      return {};
    },
    handleOperation: async () => {
      signingCalls += 1;
      return ok('0xhandled');
    },
  });

  const result = await submit({
    dependencies,
    getCurrentEditorSession: () => sessionSnapshot({ sessionClient }),
    onProgress: (value) => progress.push(value),
  });

  expect(result).toEqual({ ok: true, sessionClient });
  expect(confirmedHashes).toEqual(['0xsponsored']);
  expect(progress).toEqual(['confirming-transaction']);
  expect(walletCalls).toBe(0);
  expect(signingCalls).toBe(0);
});

test('a self-funded update switches to Lens, rechecks the session, signs, and confirms', async () => {
  const progress = [];
  const calls = [];
  const sessionClient = {
    waitForTransaction: async (hash) => {
      calls.push(['confirm', hash]);
      return ok(undefined);
    },
  };
  const bound = sessionSnapshot({ sessionClient });
  const dependencies = createDependencies({
    getConnection: () => connection(OTHER_CHAIN_ID),
    setAccountMetadata: async () =>
      ok({ __typename: 'SelfFundedTransactionRequest' }),
    switchChain: async (_config, options) => {
      calls.push(['switch', options.chainId]);
    },
    getWalletClient: async (_config, options) => {
      calls.push(['wallet', options.chainId]);
      return { account: WALLET_ADDRESS };
    },
    handleOperation: async (_wallet, operation) => {
      calls.push(['sign', operation.__typename]);
      return ok('0xself-funded');
    },
  });

  const result = await submit({
    dependencies,
    getCurrentEditorSession: sessionQueue(bound, bound, bound),
    onProgress: (value) => progress.push(value),
  });

  expect(result).toEqual({ ok: true, sessionClient });
  expect(progress).toEqual(['switching-network', 'confirming-transaction']);
  expect(calls).toEqual([
    ['switch', chains.mainnet.id],
    ['wallet', chains.mainnet.id],
    ['sign', 'SelfFundedTransactionRequest'],
    ['confirm', '0xself-funded'],
  ]);
});

test('a changed Lens authentication stops a self-funded update before signing', async () => {
  let signingCalls = 0;
  const sessionClient = { waitForTransaction: async () => ok(undefined) };
  const dependencies = createDependencies({
    getConnection: () => connection(OTHER_CHAIN_ID),
    setAccountMetadata: async () =>
      ok({ __typename: 'SelfFundedTransactionRequest' }),
    handleOperation: async () => {
      signingCalls += 1;
      return ok('0xshould-not-run');
    },
  });

  const result = await submit({
    dependencies,
    getCurrentEditorSession: sessionQueue(
      sessionSnapshot({ sessionClient }),
      sessionSnapshot({ authenticationId: 'session-b', sessionClient }),
    ),
  });

  expect(result).toEqual({
    ok: false,
    failure: { kind: 'session-changed' },
  });
  expect(signingCalls).toBe(0);
});

test('a rejected chain switch returns a network failure without opening the wallet', async () => {
  let walletCalls = 0;
  const sessionClient = { waitForTransaction: async () => ok(undefined) };
  const dependencies = createDependencies({
    getConnection: () => connection(OTHER_CHAIN_ID),
    setAccountMetadata: async () =>
      ok({ __typename: 'SelfFundedTransactionRequest' }),
    switchChain: async () => {
      throw new Error('User rejected');
    },
    getWalletClient: async () => {
      walletCalls += 1;
      return {};
    },
  });

  const result = await submit({
    dependencies,
    getCurrentEditorSession: () => sessionSnapshot({ sessionClient }),
  });

  expect(result).toEqual({
    ok: false,
    failure: {
      kind: 'network-required',
      description:
        'Switch your wallet to the Lens network to complete this save.',
    },
  });
  expect(walletCalls).toBe(0);
});

test('a final chain drift is caught after acquiring the wallet client', async () => {
  let signingCalls = 0;
  const sessionClient = { waitForTransaction: async () => ok(undefined) };
  const dependencies = createDependencies({
    setAccountMetadata: async () =>
      ok({ __typename: 'SelfFundedTransactionRequest' }),
    handleOperation: async () => {
      signingCalls += 1;
      return ok('0xshould-not-run');
    },
  });

  const result = await submit({
    dependencies,
    getCurrentEditorSession: sessionQueue(
      sessionSnapshot({ sessionClient }),
      sessionSnapshot({ sessionClient }),
      sessionSnapshot({ chainId: OTHER_CHAIN_ID, sessionClient }),
    ),
  });

  expect(result).toEqual({
    ok: false,
    failure: {
      kind: 'network-required',
      description:
        'Switch your wallet back to the Lens network and try again.',
    },
  });
  expect(signingCalls).toBe(0);
});

test('confirmation failure remains distinct after a transaction was submitted', async () => {
  const confirmationError = new Error('RPC unavailable');
  const progress = [];
  const sessionClient = {
    waitForTransaction: async () => err(confirmationError),
  };

  const result = await submit({
    dependencies: createDependencies(),
    getCurrentEditorSession: () => sessionSnapshot({ sessionClient }),
    onProgress: (value) => progress.push(value),
  });

  expect(result).toEqual({
    ok: false,
    failure: { kind: 'confirmation-failed', error: confirmationError },
  });
  expect(progress).toEqual(['confirming-transaction']);
});

test('an unbound session stops before creating a metadata operation', async () => {
  let operationCalls = 0;
  const dependencies = createDependencies({
    setAccountMetadata: async () => {
      operationCalls += 1;
      return ok({ __typename: 'SponsoredTransactionRequest', hash: '0xhash' });
    },
  });

  const result = await submit({
    dependencies,
    getCurrentEditorSession: () => ({
      authenticatedUser: null,
      connection: { status: 'disconnected' },
      sessionClient: null,
      state: 'wallet-disconnected',
    }),
  });

  expect(result).toEqual({
    ok: false,
    failure: { kind: 'session', state: 'wallet-disconnected' },
  });
  expect(operationCalls).toBe(0);
});
