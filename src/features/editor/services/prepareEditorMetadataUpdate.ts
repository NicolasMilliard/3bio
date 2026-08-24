import { StorageClient, type AclConfig } from '@lens-chain/storage-client';
import type { SessionClient } from '@lens-protocol/client';
import { fetchAccount } from '@lens-protocol/client/actions';
import type { Account } from '@lens-protocol/react';

import {
  formatMetadataBeforeUpload,
  readThreeBioMetadataAttributes,
} from '@/helpers';
import type { PersistedThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import { collectGroveResourceReferences } from '../helpers/groveResources';
import {
  buildPersistedThreeBioMetadata,
  type PersistedThreeBioDirtyFields,
} from '../helpers/buildPersistedThreeBioMetadata';
import { getMetadataUploadCacheKey } from '../helpers/metadataUploadCache';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

const storageClient = StorageClient.create();

export type MetadataUploadCacheEntry = {
  accountAddress: string;
  key: string;
  referenceKeys: string[];
  storageKey: string;
  uri: string;
};

export type EditorMetadataUploadResource = {
  storageKey: string;
  uri: string;
};

export type PrepareEditorMetadataFailure =
  | {
      kind: 'latest-account-fetch-failed';
      error: unknown;
    }
  | {
      kind: 'account-not-found';
    }
  | {
      kind: 'account-mismatch';
    }
  | {
      kind: 'unsupported-schema-version';
    }
  | {
      kind: 'publication-deleted';
    };

export type PrepareEditorMetadataResult =
  | {
      ok: true;
      cacheEntry: MetadataUploadCacheEntry;
      latestAccount: Account;
      metadataResource: EditorMetadataUploadResource;
      metadataReferenceKeys: string[];
      metadataUri: string;
      nextThreeBioMetadata: PersistedThreeBioMetadata;
    }
  | {
      ok: false;
      failure: PrepareEditorMetadataFailure;
    };

type EditorImageUris = {
  avatarUri: string | null | undefined;
  coverPictureUri: string | null | undefined;
  linksPanelBackgroundUri: string | null | undefined;
};

type UploadMetadataJson = (
  data: unknown,
  options: { acl: AclConfig },
) => Promise<EditorMetadataUploadResource>;

type PrepareEditorMetadataDependencies = {
  fetchAccount: typeof fetchAccount;
  uploadAsJson: UploadMetadataJson;
};

const defaultDependencies: PrepareEditorMetadataDependencies = {
  fetchAccount,
  uploadAsJson: (data, options) => storageClient.uploadAsJson(data, options),
};

type PrepareEditorMetadataInput = {
  accountAddress: string;
  acl: AclConfig;
  cacheEntry: MetadataUploadCacheEntry | null;
  dirtyFields: PersistedThreeBioDirtyFields;
  imageUris: EditorImageUris;
  sessionClient: SessionClient;
  values: MetadataFormValues;
  onUploaded?: (resource: EditorMetadataUploadResource) => void;
  dependencies?: PrepareEditorMetadataDependencies;
};

export const prepareEditorMetadataUpdate = async ({
  accountAddress,
  acl,
  cacheEntry,
  dirtyFields,
  imageUris,
  sessionClient,
  values,
  onUploaded,
  dependencies = defaultDependencies,
}: PrepareEditorMetadataInput): Promise<PrepareEditorMetadataResult> => {
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

  if (latestThreeBioState.metadata?.publication?.status === 'deleted') {
    return {
      ok: false,
      failure: { kind: 'publication-deleted' },
    };
  }

  const nextThreeBioMetadata = buildPersistedThreeBioMetadata({
    current: latestThreeBioState.metadata ?? {},
    values,
    ...imageUris,
    dirtyFields,
  });
  const metadataKey = getMetadataUploadCacheKey(
    latestAccount.metadata,
    nextThreeBioMetadata,
  );
  const normalizedAccountAddress = accountAddress.toLowerCase();
  const cachedUpload =
    cacheEntry?.accountAddress === normalizedAccountAddress &&
    cacheEntry.key === metadataKey
      ? {
          metadataResource: {
            storageKey: cacheEntry.storageKey,
            uri: cacheEntry.uri,
          },
          metadataReferenceKeys: cacheEntry.referenceKeys,
        }
      : undefined;
  let metadataResource = cachedUpload?.metadataResource;
  let metadataReferenceKeys = cachedUpload?.metadataReferenceKeys;

  if (!metadataResource) {
    const data = formatMetadataBeforeUpload(
      latestAccount,
      nextThreeBioMetadata,
    );
    metadataResource = await dependencies.uploadAsJson(data, { acl });
    // Native Lens media remains structured in `data`, while 3bio is stored in
    // a serialized JSON attribute. Inspect both representations so the active
    // publication protects every managed resource referenced by the upload.
    metadataReferenceKeys = [
      ...new Set([
        ...collectGroveResourceReferences(data),
        ...collectGroveResourceReferences(nextThreeBioMetadata),
      ]),
    ].sort();
    onUploaded?.(metadataResource);
  }

  metadataReferenceKeys ??= [];

  return {
    ok: true,
    cacheEntry: {
      accountAddress: normalizedAccountAddress,
      key: metadataKey,
      referenceKeys: metadataReferenceKeys,
      storageKey: metadataResource.storageKey,
      uri: metadataResource.uri,
    },
    latestAccount,
    metadataResource,
    metadataReferenceKeys,
    metadataUri: metadataResource.uri,
    nextThreeBioMetadata,
  };
};
