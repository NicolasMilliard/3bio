import { THREEBIO_ATTRIBUTE_KEY } from '../constants/attributes';
import {
  LENS_METADATA_MAX_ATTRIBUTES,
  THREE_BIO_BIO_MAX_LENGTH,
  THREE_BIO_LINK_KEY_MAX_LENGTH,
  THREE_BIO_LINKS_MAX_ITEMS,
  THREE_BIO_METADATA_MAX_BYTES,
  THREE_BIO_METADATA_MAX_CANDIDATES,
  THREE_BIO_METADATA_MAX_DEPTH,
  THREE_BIO_METADATA_MAX_TOMBSTONES,
  THREE_BIO_METADATA_SCHEMA_VERSION,
  THREE_BIO_METADATA_TOTAL_CANDIDATE_BYTES,
  THREE_BIO_NAME_MAX_LENGTH,
  THREE_BIO_SETTINGS_ID_MAX_LENGTH,
  THREE_BIO_SOCIAL_LINKS_MAX_ITEMS,
  THREE_BIO_TOMBSTONE_PATHS,
  THREE_BIO_URL_MAX_LENGTH,
  type ThreeBioTombstonePath,
} from '../constants/metadata';
import {
  THREE_BIO_DEFAULT_THEME,
  THREE_BIO_THEME_NAMES,
  type ThreeBioThemeName,
} from '../constants/themes';
import type {
  LensLink,
  ThreeBioMetadata,
  ThreeBioProfile,
} from '../schemas/threeBioMetadata.schema';

type MetadataAttributeLike = {
  key?: unknown;
  value?: unknown;
};

type ThemePatch = {
  name?: ThreeBioThemeName;
  displayStatistics?: boolean;
  displayBranding?: boolean;
};

type SubscriptionPatch = {
  id?: string;
  type?: 'free' | 'premium';
};

type MetadataPatch = {
  profile?: ThreeBioProfile;
  theme?: ThemePatch;
  settings?: {
    subscription: SubscriptionPatch;
  };
};

type ParsedMetadataRecord = {
  index: number;
  patch: MetadataPatch;
  schemaVersion?: typeof THREE_BIO_METADATA_SCHEMA_VERSION;
  tombstones: Set<ThreeBioTombstonePath>;
  updatedAt?: string;
  updatedAtSortKey?: {
    utcWholeSecondMs: bigint;
    fraction: string;
  };
};

type DecodedCandidate = {
  bytes: number;
  value: Record<string, unknown>;
};

export type ReadThreeBioMetadataResult = {
  metadata: ThreeBioMetadata | undefined;
  hasUnsupportedSchemaVersion: boolean;
};

const textEncoder = new TextEncoder();
const supportedLinkTypes = new Set([
  'Boolean',
  'Date',
  'Number',
  'JSON',
  'String',
]);
const supportedThemes = new Set<string>(THREE_BIO_THEME_NAMES);
const supportedTombstones = new Set<string>(THREE_BIO_TOMBSTONE_PATHS);

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getUtf8ByteLength = (value: string) =>
  textEncoder.encode(value).byteLength;

const isWithinDepthLimit = (value: unknown) => {
  const pending: Array<{ depth: number; value: unknown }> = [
    { depth: 0, value },
  ];

  while (pending.length > 0) {
    const current = pending.pop();

    if (!current) break;
    if (current.depth > THREE_BIO_METADATA_MAX_DEPTH) return false;
    if (!current.value || typeof current.value !== 'object') continue;

    const children = Array.isArray(current.value)
      ? current.value
      : Object.values(current.value);

    for (const child of children) {
      pending.push({ depth: current.depth + 1, value: child });
    }
  }

  return true;
};

const decodeCandidate = (value: unknown): DecodedCandidate | undefined => {
  try {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (serialized === undefined) return undefined;

    const bytes = getUtf8ByteLength(serialized);

    if (bytes > THREE_BIO_METADATA_MAX_BYTES) return undefined;

    const parsed = JSON.parse(serialized) as unknown;

    if (!isRecord(parsed) || !isWithinDepthLimit(parsed)) return undefined;

    return { bytes, value: parsed };
  } catch {
    return undefined;
  }
};

const parseHttpUrl = (value: unknown) => {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();

  if (normalized.length === 0 || normalized.length > THREE_BIO_URL_MAX_LENGTH) {
    return undefined;
  }

  try {
    const url = new URL(normalized);

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? normalized
      : undefined;
  } catch {
    return undefined;
  }
};

const parseBoundedString = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.length <= maxLength ? value : undefined;

const parseLink = (value: unknown): LensLink | undefined => {
  if (!isRecord(value)) return undefined;

  // Early edge-rendered profiles only persisted key/value pairs. Treat their
  // missing type as String while still rejecting explicit unknown types.
  const type = value.type === undefined ? 'String' : value.type;
  const key = parseBoundedString(
    value.key,
    THREE_BIO_LINK_KEY_MAX_LENGTH,
  )?.trim();
  const url = parseHttpUrl(value.value);

  if (
    typeof type !== 'string' ||
    !supportedLinkTypes.has(type) ||
    !key ||
    !url
  ) {
    return undefined;
  }

  return { type, key, value: url } as LensLink;
};

const parseLinks = (value: unknown, maxItems: number) => {
  if (!Array.isArray(value)) return undefined;
  if (value.length === 0) return [];

  const links: LensLink[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const link = parseLink(value[index]);

    if (link) links.push(link);
    if (links.length >= maxItems) break;
  }

  return links.length > 0 ? links : undefined;
};

const addNullTombstone = (
  record: Record<string, unknown>,
  field: string,
  path: ThreeBioTombstonePath,
  versioned: boolean,
  tombstones: Set<ThreeBioTombstonePath>,
) => {
  if (versioned && hasOwn(record, field) && record[field] === null) {
    tombstones.add(path);
    return true;
  }

  return false;
};

const parseProfile = (
  value: unknown,
  versioned: boolean,
  tombstones: Set<ThreeBioTombstonePath>,
): ThreeBioProfile | undefined => {
  if (!isRecord(value)) return undefined;

  const profile: ThreeBioProfile = {};
  let hasRecognizedField = false;
  let hasValidField = false;

  for (const field of [
    'avatar',
    'coverPicture',
    'linksPanelBackground',
  ] as const) {
    const path = `profile.${field}` as ThreeBioTombstonePath;

    if (hasOwn(value, field)) hasRecognizedField = true;

    if (addNullTombstone(value, field, path, versioned, tombstones)) {
      hasValidField = true;
      continue;
    }

    const url = parseHttpUrl(value[field]);

    if (url) {
      profile[field] = url;
      hasValidField = true;
    }
  }

  for (const [field, maxLength] of [
    ['name', THREE_BIO_NAME_MAX_LENGTH],
    ['bio', THREE_BIO_BIO_MAX_LENGTH],
  ] as const) {
    const path = `profile.${field}` as ThreeBioTombstonePath;

    if (hasOwn(value, field)) hasRecognizedField = true;

    if (addNullTombstone(value, field, path, versioned, tombstones)) {
      hasValidField = true;
      continue;
    }

    if (!versioned && value[field] === null) {
      profile[field] = null;
      hasValidField = true;
      continue;
    }

    const stringValue = parseBoundedString(value[field], maxLength);

    if (stringValue !== undefined) {
      profile[field] = stringValue;
      hasValidField = true;
    }
  }

  if (hasOwn(value, 'socialLinks')) {
    hasRecognizedField = true;

    if (
      addNullTombstone(
        value,
        'socialLinks',
        'profile.socialLinks',
        versioned,
        tombstones,
      )
    ) {
      hasValidField = true;
    } else {
      const socialLinks = parseLinks(
        value.socialLinks,
        THREE_BIO_SOCIAL_LINKS_MAX_ITEMS,
      );

      if (socialLinks !== undefined) {
        profile.socialLinks = socialLinks;
        hasValidField = true;
      }
    }
  }

  if (hasOwn(value, 'links')) {
    hasRecognizedField = true;

    if (
      addNullTombstone(
        value,
        'links',
        'profile.links',
        versioned,
        tombstones,
      )
    ) {
      hasValidField = true;
    } else {
      const links = parseLinks(value.links, THREE_BIO_LINKS_MAX_ITEMS);

      if (links !== undefined) {
        profile.links = links;
        hasValidField = true;
      }
    }
  }

  return hasValidField || !hasRecognizedField ? profile : undefined;
};

const parseTheme = (
  value: unknown,
  versioned: boolean,
  tombstones: Set<ThreeBioTombstonePath>,
): ThemePatch | undefined => {
  if (!isRecord(value)) return undefined;

  const theme: ThemePatch = {};
  let hasValidField = false;

  if (addNullTombstone(value, 'name', 'theme.name', versioned, tombstones)) {
    hasValidField = true;
  } else if (typeof value.name === 'string' && supportedThemes.has(value.name)) {
    theme.name = value.name as ThreeBioThemeName;
    hasValidField = true;
  }

  for (const field of ['displayStatistics', 'displayBranding'] as const) {
    const path = `theme.${field}` as ThreeBioTombstonePath;

    if (addNullTombstone(value, field, path, versioned, tombstones)) {
      hasValidField = true;
    } else if (typeof value[field] === 'boolean') {
      theme[field] = value[field];
      hasValidField = true;
    }
  }

  return hasValidField || Object.keys(value).length === 0 ? theme : undefined;
};

const parseSettings = (
  value: unknown,
  versioned: boolean,
  tombstones: Set<ThreeBioTombstonePath>,
): MetadataPatch['settings'] => {
  if (!isRecord(value) || !isRecord(value.subscription)) return undefined;

  const subscription: SubscriptionPatch = {};
  let hasValidField = false;
  const rawSubscription = value.subscription;

  if (
    addNullTombstone(
      rawSubscription,
      'id',
      'settings.subscription.id',
      versioned,
      tombstones,
    )
  ) {
    hasValidField = true;
  } else {
    const id = parseBoundedString(
      rawSubscription.id,
      THREE_BIO_SETTINGS_ID_MAX_LENGTH,
    );

    if (id !== undefined) {
      subscription.id = id;
      hasValidField = true;
    }
  }

  if (
    addNullTombstone(
      rawSubscription,
      'type',
      'settings.subscription.type',
      versioned,
      tombstones,
    )
  ) {
    hasValidField = true;
  } else if (
    rawSubscription.type === 'free' ||
    rawSubscription.type === 'premium'
  ) {
    subscription.type = rawSubscription.type;
    hasValidField = true;
  }

  return hasValidField || Object.keys(rawSubscription).length === 0
    ? { subscription }
    : undefined;
};

const parseTombstones = (value: unknown) => {
  const tombstones = new Set<ThreeBioTombstonePath>();

  if (!Array.isArray(value)) return tombstones;

  for (let index = 0; index < value.length; index += 1) {
    const path = value[index];

    if (typeof path === 'string' && supportedTombstones.has(path)) {
      tombstones.add(path as ThreeBioTombstonePath);
    }

    if (tombstones.size >= THREE_BIO_METADATA_MAX_TOMBSTONES) break;
  }

  return tombstones;
};

const parseUpdatedAt = (value: unknown) => {
  if (typeof value !== 'string') return undefined;

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(
      value,
    );

  if (!match) return undefined;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const offsetHourText = match[7];
  const offsetMinuteText = match[8];
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  if (
    daysInMonth === undefined ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    (offsetHourText !== undefined && Number(offsetHourText) > 23) ||
    (offsetMinuteText !== undefined && Number(offsetMinuteText) > 59)
  ) {
    return undefined;
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) return undefined;

  const fractionalSeconds = /\.(\d+)/.exec(value)?.[1] ?? '';
  const utcWholeSecondMs = BigInt(Math.floor(timestamp / 1_000) * 1_000);
  const fractionSortKey = fractionalSeconds.replace(/0+$/, '');

  return {
    utcWholeSecondMs,
    fractionSortKey,
    value,
  };
};

const hasPatchLeaf = (patch: MetadataPatch) =>
  (patch.profile !== undefined && Object.keys(patch.profile).length > 0) ||
  (patch.theme !== undefined && Object.keys(patch.theme).length > 0) ||
  (patch.settings !== undefined &&
    Object.keys(patch.settings.subscription).length > 0);

const parseDecodedCandidate = (
  candidate: DecodedCandidate,
  index: number,
): {
  record?: ParsedMetadataRecord;
  unsupported: boolean;
} => {
  const raw = candidate.value;
  const hasSchemaVersion = hasOwn(raw, 'schemaVersion');
  const rawVersion = hasSchemaVersion ? raw.schemaVersion : undefined;
  const versioned = hasSchemaVersion;

  if (versioned && rawVersion !== THREE_BIO_METADATA_SCHEMA_VERSION) {
    return { unsupported: true };
  }

  const updatedAt = versioned ? parseUpdatedAt(raw.updatedAt) : undefined;

  if (versioned && !updatedAt) return { unsupported: false };

  const tombstones = parseTombstones(raw.tombstones);
  const patch: MetadataPatch = {};

  if (hasOwn(raw, 'profile')) {
    const profile = parseProfile(raw.profile, versioned, tombstones);

    if (profile) patch.profile = profile;
  }

  if (hasOwn(raw, 'theme')) {
    const theme = parseTheme(raw.theme, versioned, tombstones);

    if (theme) patch.theme = theme;
  }

  if (hasOwn(raw, 'settings')) {
    const settings = parseSettings(raw.settings, versioned, tombstones);

    if (settings) patch.settings = settings;
  }

  if (
    Object.keys(patch).length === 0 &&
    tombstones.size === 0 &&
    (hasOwn(raw, 'profile') || hasOwn(raw, 'theme') || hasOwn(raw, 'settings'))
  ) {
    return { unsupported: false };
  }

  return {
    unsupported: false,
    record: {
      index,
      patch,
      ...(versioned
        ? {
            schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
            updatedAt: updatedAt?.value,
            updatedAtSortKey: updatedAt
              ? {
                  utcWholeSecondMs: updatedAt.utcWholeSecondMs,
                  fraction: updatedAt.fractionSortKey,
                }
              : undefined,
          }
        : {}),
      tombstones,
    },
  };
};

const recordSort = (
  left: ParsedMetadataRecord,
  right: ParsedMetadataRecord,
) => {
  const leftIsDated = left.updatedAtSortKey !== undefined;
  const rightIsDated = right.updatedAtSortKey !== undefined;

  if (leftIsDated !== rightIsDated) return leftIsDated ? 1 : -1;

  if (
    left.updatedAtSortKey !== undefined &&
    right.updatedAtSortKey !== undefined
  ) {
    if (
      left.updatedAtSortKey.utcWholeSecondMs !==
      right.updatedAtSortKey.utcWholeSecondMs
    ) {
      return left.updatedAtSortKey.utcWholeSecondMs <
        right.updatedAtSortKey.utcWholeSecondMs
        ? -1
        : 1;
    }

    const maxFractionLength = Math.max(
      left.updatedAtSortKey.fraction.length,
      right.updatedAtSortKey.fraction.length,
    );
    const leftFraction = left.updatedAtSortKey.fraction.padEnd(
      maxFractionLength,
      '0',
    );
    const rightFraction = right.updatedAtSortKey.fraction.padEnd(
      maxFractionLength,
      '0',
    );

    if (leftFraction !== rightFraction) {
      return leftFraction < rightFraction ? -1 : 1;
    }
  }

  return left.index - right.index;
};

const removePath = (state: MetadataPatch, path: ThreeBioTombstonePath) => {
  switch (path) {
    case 'profile.avatar':
      if (state.profile) delete state.profile.avatar;
      break;
    case 'profile.coverPicture':
      if (state.profile) delete state.profile.coverPicture;
      break;
    case 'profile.linksPanelBackground':
      if (state.profile) delete state.profile.linksPanelBackground;
      break;
    case 'profile.name':
      if (state.profile) delete state.profile.name;
      break;
    case 'profile.bio':
      if (state.profile) delete state.profile.bio;
      break;
    case 'profile.socialLinks':
      if (state.profile) delete state.profile.socialLinks;
      break;
    case 'profile.links':
      if (state.profile) delete state.profile.links;
      break;
    case 'theme.name':
      if (state.theme) delete state.theme.name;
      break;
    case 'theme.displayStatistics':
      if (state.theme) delete state.theme.displayStatistics;
      break;
    case 'theme.displayBranding':
      if (state.theme) delete state.theme.displayBranding;
      break;
    case 'settings.subscription.id':
      if (state.settings) delete state.settings.subscription.id;
      break;
    case 'settings.subscription.type':
      if (state.settings) delete state.settings.subscription.type;
      break;
  }
};

const applyProfile = (
  state: MetadataPatch,
  profile: ThreeBioProfile,
  tombstones: Set<ThreeBioTombstonePath>,
) => {
  state.profile ??= {};

  for (const field of [
    'avatar',
    'coverPicture',
    'linksPanelBackground',
    'name',
    'bio',
    'socialLinks',
    'links',
  ] as const) {
    if (!hasOwn(profile, field)) continue;

    state.profile[field] = profile[field] as never;
    tombstones.delete(`profile.${field}` as ThreeBioTombstonePath);
  }
};

const applyTheme = (
  state: MetadataPatch,
  theme: ThemePatch,
  tombstones: Set<ThreeBioTombstonePath>,
) => {
  state.theme ??= {};

  for (const field of [
    'name',
    'displayStatistics',
    'displayBranding',
  ] as const) {
    if (!hasOwn(theme, field)) continue;

    state.theme[field] = theme[field] as never;
    tombstones.delete(`theme.${field}` as ThreeBioTombstonePath);
  }
};

const applySettings = (
  state: MetadataPatch,
  settings: NonNullable<MetadataPatch['settings']>,
  tombstones: Set<ThreeBioTombstonePath>,
) => {
  state.settings ??= { subscription: {} };

  for (const field of ['id', 'type'] as const) {
    if (!hasOwn(settings.subscription, field)) continue;

    state.settings.subscription[field] = settings.subscription[field] as never;
    tombstones.delete(
      `settings.subscription.${field}` as ThreeBioTombstonePath,
    );
  }
};

const mergeRecords = (
  records: ParsedMetadataRecord[],
): ThreeBioMetadata | undefined => {
  if (records.length === 0) return undefined;

  const state: MetadataPatch = {};
  const tombstones = new Set<ThreeBioTombstonePath>();
  let latestVersionedRecord: ParsedMetadataRecord | undefined;

  records.sort(recordSort);

  for (const record of records) {
    if (record.patch.profile) {
      applyProfile(state, record.patch.profile, tombstones);
    }
    if (record.patch.theme) applyTheme(state, record.patch.theme, tombstones);
    if (record.patch.settings) {
      applySettings(state, record.patch.settings, tombstones);
    }

    for (const path of record.tombstones) {
      removePath(state, path);
      tombstones.add(path);
    }

    if (record.schemaVersion !== undefined) latestVersionedRecord = record;
  }

  // Legacy null text values meant "use Lens-native metadata". Once any v1
  // patch participates in the merged state, omit those inherited nulls so
  // they cannot be reinterpreted as v1 tombstones when the state is compacted.
  if (latestVersionedRecord && state.profile) {
    if (state.profile.name === null) delete state.profile.name;
    if (state.profile.bio === null) delete state.profile.bio;
  }

  const metadataState = {
    ...(state.profile ? { profile: state.profile } : {}),
    ...(state.theme
      ? {
          theme: {
            name: state.theme.name ?? THREE_BIO_DEFAULT_THEME,
            displayStatistics: state.theme.displayStatistics ?? true,
            displayBranding: state.theme.displayBranding ?? true,
          },
        }
      : {}),
    ...(state.settings
      ? {
          settings: {
            subscription: {
              ...state.settings.subscription,
              type: state.settings.subscription.type ?? 'free',
            },
          },
        }
      : {}),
    ...(tombstones.size > 0
      ? {
          tombstones: THREE_BIO_TOMBSTONE_PATHS.filter((path) =>
            tombstones.has(path),
          ),
        }
      : {}),
  };

  return latestVersionedRecord
    ? {
        schemaVersion: THREE_BIO_METADATA_SCHEMA_VERSION,
        updatedAt: latestVersionedRecord.updatedAt!,
        ...metadataState,
      }
    : metadataState;
};

export const parseThreeBioMetadata = (
  value: unknown,
): ThreeBioMetadata | undefined => {
  const candidate = decodeCandidate(value);

  if (!candidate) return undefined;

  const parsed = parseDecodedCandidate(candidate, 0);

  return parsed.record ? mergeRecords([parsed.record]) : undefined;
};

export const readThreeBioMetadataAttributes = (
  attributes: readonly MetadataAttributeLike[] | null | undefined,
): ReadThreeBioMetadataResult => {
  if (!attributes?.length) {
    return { metadata: undefined, hasUnsupportedSchemaVersion: false };
  }

  const records: ParsedMetadataRecord[] = [];
  let inspectedAttributes = 0;
  let semanticCandidates = 0;
  let totalCandidateBytes = 0;
  let hasUnsupportedSchemaVersion = false;

  for (let index = attributes.length - 1; index >= 0; index -= 1) {
    inspectedAttributes += 1;

    if (inspectedAttributes > LENS_METADATA_MAX_ATTRIBUTES) break;

    const attribute = attributes[index];

    if (attribute?.key !== THREEBIO_ATTRIBUTE_KEY) continue;

    const candidate = decodeCandidate(attribute.value);

    if (!candidate) continue;
    if (
      totalCandidateBytes + candidate.bytes >
      THREE_BIO_METADATA_TOTAL_CANDIDATE_BYTES
    ) {
      continue;
    }

    totalCandidateBytes += candidate.bytes;
    const parsed = parseDecodedCandidate(candidate, index);

    if (!parsed.record && !parsed.unsupported) continue;

    hasUnsupportedSchemaVersion ||= parsed.unsupported;

    if (parsed.record) {
      records.push(parsed.record);

      const isNeutralRecord =
        !hasPatchLeaf(parsed.record.patch) &&
        parsed.record.tombstones.size === 0;

      if (!isNeutralRecord) semanticCandidates += 1;
    } else {
      semanticCandidates += 1;
    }

    if (semanticCandidates >= THREE_BIO_METADATA_MAX_CANDIDATES) break;
  }

  return {
    metadata: mergeRecords(records),
    hasUnsupportedSchemaVersion,
  };
};

export const parseThreeBioMetadataAttributes = (
  attributes: readonly MetadataAttributeLike[] | null | undefined,
) => readThreeBioMetadataAttributes(attributes).metadata;

export const hasThreeBioMetadataTombstone = (
  metadata: ThreeBioMetadata | undefined,
  path: ThreeBioTombstonePath,
) => metadata?.tombstones?.includes(path) ?? false;
