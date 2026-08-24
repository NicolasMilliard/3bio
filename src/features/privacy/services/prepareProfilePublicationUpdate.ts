import { StorageClient, type AclConfig } from '@lens-chain/storage-client';
import type { SessionClient } from '@lens-protocol/client';
import { fetchAccount } from '@lens-protocol/client/actions';
import type { Account } from '@lens-protocol/react';

import { collectGroveResourceReferences } from '@/features/editor/helpers/groveResources';
import {
  buildThreeBioPublicationUpdate,
  formatMetadataBeforeUpload,
  readThreeBioMetadataAttributes,
} from '@/helpers';
import type {
  PersistedThreeBioMetadata,
  ThreeBioPublicationStatus,
} from '@/schemas/threeBioMetadata.schema';

const storageClient = StorageClient.create();

export type PublicationMetadataResource = {
  gatewayUrl: string;
  storageKey: string;
  uri: string;
};

export type PrepareProfilePublicationFailure =
  | { kind: 'latest-account-fetch-failed'; error: unknown }
  | { kind: 'account-not-found' }
  | { kind: 'account-mismatch' }
  | { kind: 'unsupported-schema-version' };

export type PrepareProfilePublicationResult =
  | {
      ok: true;
      latestAccount: Account;
      metadataResource: PublicationMetadataResource;
      nextThreeBioMetadata: PersistedThreeBioMetadata;
      referenceKeys: string[];
    }
  | { ok: false; failure: PrepareProfilePublicationFailure };

type PrepareProfilePublicationDependencies = {
  fetchAccount: typeof fetchAccount;
  uploadAsJson: (
    data: unknown,
    options: { acl: AclConfig },
  ) => Promise<PublicationMetadataResource>;
};

const defaultDependencies: PrepareProfilePublicationDependencies = {
  fetchAccount,
  uploadAsJson: (data, options) => storageClient.uploadAsJson(data, options),
};

export const prepareProfilePublicationUpdate = async ({
  accountAddress,
  acl,
  sessionClient,
  status,
  updatedAt = new Date().toISOString(),
  dependencies = defaultDependencies,
}: {
  accountAddress: string;
  acl: AclConfig;
  sessionClient: SessionClient;
  status: ThreeBioPublicationStatus;
  updatedAt?: string;
  dependencies?: PrepareProfilePublicationDependencies;
}): Promise<PrepareProfilePublicationResult> => {
  const latestAccountResult = await dependencies.fetchAccount(sessionClient, {
    address: accountAddress,
  });

  if (latestAccountResult.isErr()) {
    return {
      ok: false,
      failure: {
        kind: 'latest-account-fetch-failed',
        error: latestAccountResult.error,
      },
    };
  }

  const latestAccount = latestAccountResult.value;

  if (!latestAccount) {
    return { ok: false, failure: { kind: 'account-not-found' } };
  }

  if (latestAccount.address.toLowerCase() !== accountAddress.toLowerCase()) {
    return { ok: false, failure: { kind: 'account-mismatch' } };
  }

  const latestThreeBioState = readThreeBioMetadataAttributes(
    latestAccount.metadata?.attributes ?? [],
  );

  if (latestThreeBioState.hasUnsupportedSchemaVersion) {
    return {
      ok: false,
      failure: { kind: 'unsupported-schema-version' },
    };
  }

  const nextThreeBioMetadata = buildThreeBioPublicationUpdate({
    current: latestThreeBioState.metadata,
    status,
    updatedAt,
  });
  const data = formatMetadataBeforeUpload(latestAccount, nextThreeBioMetadata);
  const referenceKeys = [
    ...new Set([
      ...collectGroveResourceReferences(data),
      ...collectGroveResourceReferences(nextThreeBioMetadata),
    ]),
  ].sort();
  const metadataResource = await dependencies.uploadAsJson(data, { acl });

  return {
    ok: true,
    latestAccount,
    metadataResource,
    nextThreeBioMetadata,
    referenceKeys,
  };
};
