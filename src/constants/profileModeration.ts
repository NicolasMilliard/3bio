/**
 * Profiles listed here are hidden at build/deploy time. Keep entries in their
 * canonical forms where possible; the matcher also trims and lowercases them.
 *
 * Moderation deliberately returns the same public response as an unknown Lens
 * profile so this list must not contain explanations or other private data.
 */
export const PROFILE_MODERATION_DENYLIST = {
  accountAddresses: [] as readonly string[],
  handles: [] as readonly string[],
};
