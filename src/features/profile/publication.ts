import { PROFILE_MODERATION_DENYLIST } from '../../constants/profileModeration';
import { readThreeBioMetadataAttributes } from '../../helpers/parseThreeBioMetadata';
import type { ThreeBioPublicationStatus } from '../../schemas/threeBioMetadata.schema';

export type ProfileModerationDenylist = {
  accountAddresses: readonly string[];
  handles: readonly string[];
};

export type ProfilePublicationDecision =
  | {
      isPublic: true;
      status: 'public';
    }
  | {
      isPublic: false;
      reason:
        | 'moderated'
        | 'opted-out'
        | 'deleted'
        | 'unsupported-schema';
      status: ThreeBioPublicationStatus;
    };

export const normalizeLensHandleForModeration = (handle: string) =>
  handle.trim().replace(/^@/, '').toLowerCase();

export const normalizeLensAccountAddressForModeration = (address: string) =>
  address.trim().toLowerCase();

export const createProfileModerationMatcher = (
  denylist: ProfileModerationDenylist,
) => {
  const deniedHandles = new Set(
    denylist.handles
      .map(normalizeLensHandleForModeration)
      .filter((handle) => handle.length > 0),
  );
  const deniedAccountAddresses = new Set(
    denylist.accountAddresses
      .map(normalizeLensAccountAddressForModeration)
      .filter((address) => address.length > 0),
  );

  return ({
    accountAddress,
    lensHandle,
  }: {
    accountAddress?: string | null;
    lensHandle?: string | null;
  }) =>
    (lensHandle !== undefined &&
      lensHandle !== null &&
      deniedHandles.has(normalizeLensHandleForModeration(lensHandle))) ||
    (accountAddress !== undefined &&
      accountAddress !== null &&
      deniedAccountAddresses.has(
        normalizeLensAccountAddressForModeration(accountAddress),
      ));
};

const isStaticallyModerated = createProfileModerationMatcher(
  PROFILE_MODERATION_DENYLIST,
);

export const readProfilePublicationState = (
  attributes:
    | readonly { key?: unknown; value?: unknown }[]
    | null
    | undefined,
) => {
  const state = readThreeBioMetadataAttributes(attributes);

  return {
    hasUnsupportedSchemaVersion: state.hasUnsupportedSchemaVersion,
    status: state.metadata?.publication?.status ?? 'public',
  } as const;
};

export const getProfilePublicationStatus = (
  attributes:
    | readonly { key?: unknown; value?: unknown }[]
    | null
    | undefined,
): ThreeBioPublicationStatus => readProfilePublicationState(attributes).status;

export const getProfilePublicationDecision = ({
  accountAddress,
  hasUnsupportedSchemaVersion = false,
  lensHandle,
  publicationStatus = 'public',
}: {
  accountAddress?: string | null;
  hasUnsupportedSchemaVersion?: boolean;
  lensHandle?: string | null;
  publicationStatus?: ThreeBioPublicationStatus;
}): ProfilePublicationDecision => {
  if (isStaticallyModerated({ accountAddress, lensHandle })) {
    return {
      isPublic: false,
      reason: 'moderated',
      status: publicationStatus,
    };
  }

  // A newer schema may contain privacy semantics this release does not know
  // how to interpret, so public rendering fails closed until it is supported.
  if (hasUnsupportedSchemaVersion) {
    return {
      isPublic: false,
      reason: 'unsupported-schema',
      status: publicationStatus,
    };
  }

  if (publicationStatus === 'opted-out') {
    return {
      isPublic: false,
      reason: 'opted-out',
      status: publicationStatus,
    };
  }

  if (publicationStatus === 'deleted') {
    return {
      isPublic: false,
      reason: 'deleted',
      status: publicationStatus,
    };
  }

  return { isPublic: true, status: 'public' };
};
