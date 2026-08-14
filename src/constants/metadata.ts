export const THREE_BIO_METADATA_SCHEMA_VERSION = 1 as const;

export const THREE_BIO_METADATA_MAX_BYTES = 64 * 1024;
export const THREE_BIO_METADATA_TOTAL_CANDIDATE_BYTES = 256 * 1024;
export const THREE_BIO_METADATA_MAX_CANDIDATES = 16;
export const THREE_BIO_METADATA_MAX_DEPTH = 12;

export const THREE_BIO_NAME_MAX_LENGTH = 200;
export const THREE_BIO_BIO_MAX_LENGTH = 5_000;
export const THREE_BIO_URL_MAX_LENGTH = 2_048;
export const THREE_BIO_LINK_KEY_MAX_LENGTH = 512;
export const THREE_BIO_SETTINGS_ID_MAX_LENGTH = 256;
export const THREE_BIO_LINKS_MAX_ITEMS = 100;
export const THREE_BIO_SOCIAL_LINKS_MAX_ITEMS = 32;

export const THREE_BIO_TOMBSTONE_PATHS = [
  'profile.avatar',
  'profile.coverPicture',
  'profile.linksPanelBackground',
  'profile.name',
  'profile.bio',
  'profile.socialLinks',
  'profile.links',
  'theme.name',
  'theme.displayStatistics',
  'theme.displayBranding',
  'settings.subscription.id',
  'settings.subscription.type',
] as const;

export type ThreeBioTombstonePath = (typeof THREE_BIO_TOMBSTONE_PATHS)[number];

export const THREE_BIO_METADATA_MAX_TOMBSTONES =
  THREE_BIO_TOMBSTONE_PATHS.length;

export const LENS_METADATA_MAX_ATTRIBUTES = 100;
export const LENS_METADATA_RESPONSE_MAX_BYTES = 256 * 1024;
