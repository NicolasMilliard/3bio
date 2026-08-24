import { THREE_BIO_METADATA_SCHEMA_VERSION } from '../constants/metadata';
import {
  persistedThreeBioMetadataSchema,
  type PersistedThreeBioMetadata,
  type ThreeBioMetadata,
  type ThreeBioPublicationStatus,
} from '../schemas/threeBioMetadata.schema';

export const buildThreeBioPublicationUpdate = ({
  current,
  status,
  updatedAt,
}: {
  current?: ThreeBioMetadata;
  status: ThreeBioPublicationStatus;
  updatedAt: string;
}): PersistedThreeBioMetadata => {
  if (status === 'deleted') {
    return persistedThreeBioMetadataSchema.parse({
      schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
      updatedAt,
      publication: { status },
    });
  }

  const profile = current?.profile ? { ...current.profile } : undefined;

  // Legacy nulls meant "fall back to Lens". They must not be converted into
  // v1 deletion tombstones by a publication-only update.
  if (current?.schemaVersion === undefined && profile) {
    if (profile.name === null) delete profile.name;
    if (profile.bio === null) delete profile.bio;
  }

  return persistedThreeBioMetadataSchema.parse({
    schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
    updatedAt,
    ...(profile === undefined ? {} : { profile }),
    ...(current?.theme === undefined ? {} : { theme: current.theme }),
    ...(current?.settings === undefined ? {} : { settings: current.settings }),
    ...(current?.tombstones === undefined
      ? {}
      : { tombstones: current.tombstones }),
    publication: { status },
  });
};
