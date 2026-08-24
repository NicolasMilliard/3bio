import { GROVE_MEDIA_ORIGIN } from '@/lib/trustedMedia';

const MAX_GROVE_STORAGE_KEY_LENGTH = 512;
const MAX_REFERENCE_DEPTH = 32;
const GROVE_STORAGE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]*$/;
const LENS_URI_PREFIX = 'lens://';

export type GroveResourceReferenceDiff = {
  added: string[];
  removed: string[];
  retained: string[];
};

export type GroveResourceReferenceInspection = {
  inspectionComplete: boolean;
  referenceKeys: string[];
};

type ManagedGroveResourceLike = {
  storageKey: string;
};

const isPlainObject = (value: object) => {
  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
};

const normalizeRawGroveStorageKey = (value: string) => {
  if (
    value.length === 0 ||
    value.length > MAX_GROVE_STORAGE_KEY_LENGTH ||
    value === '.' ||
    value === '..' ||
    !GROVE_STORAGE_KEY_PATTERN.test(value)
  ) {
    return null;
  }

  return value;
};

/**
 * Normalizes an opaque key returned by Grove or a canonical `lens://` URI.
 * Gateway URLs are deliberately handled separately so arbitrary origins are
 * never interpreted as Grove-owned resources.
 */
export const normalizeGroveStorageKey = (value: unknown): string | null => {
  if (typeof value !== 'string' || value !== value.trim()) return null;

  const storageKey = value.startsWith(LENS_URI_PREFIX)
    ? value.slice(LENS_URI_PREFIX.length)
    : value;

  return normalizeRawGroveStorageKey(storageKey);
};

/**
 * Extracts a key only from a `lens://` URI or the exact production Grove
 * gateway origin used by the installed storage client.
 */
export const getGroveStorageKeyFromReference = (
  value: unknown,
): string | null => {
  if (typeof value !== 'string' || value !== value.trim()) return null;

  if (value.startsWith(LENS_URI_PREFIX)) {
    return normalizeGroveStorageKey(value);
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    url.origin !== GROVE_MEDIA_ORIGIN ||
    !url.pathname.startsWith('/') ||
    url.pathname.indexOf('/', 1) !== -1
  ) {
    return null;
  }

  try {
    return normalizeRawGroveStorageKey(
      decodeURIComponent(url.pathname.slice(1)),
    );
  } catch {
    return null;
  }
};

/**
 * Collects Grove references from JSON-like data. Finding a reference does not
 * establish ownership; callers must intersect these keys with the local
 * managed-resource manifest before attempting deletion.
 */
export const inspectGroveResourceReferences = (
  value: unknown,
): GroveResourceReferenceInspection => {
  const references = new Set<string>();
  const visited = new WeakSet<object>();
  let inspectionComplete = true;

  const visit = (current: unknown, depth: number) => {
    if (depth > MAX_REFERENCE_DEPTH) {
      inspectionComplete = false;
      return;
    }

    if (typeof current === 'string') {
      const storageKey = getGroveStorageKeyFromReference(current);

      if (storageKey) references.add(storageKey);
      return;
    }

    if (!current || typeof current !== 'object' || visited.has(current)) {
      return;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) visit(item, depth + 1);
      return;
    }

    if (!isPlainObject(current)) return;

    for (const item of Object.values(current)) {
      visit(item, depth + 1);
    }
  };

  visit(value, 0);

  return {
    inspectionComplete,
    referenceKeys: [...references].sort(),
  };
};

export const collectGroveResourceReferences = (value: unknown): string[] =>
  inspectGroveResourceReferences(value).referenceKeys;

const normalizeGroveStorageKeys = (values: Iterable<string>) => {
  const keys = new Set<string>();

  for (const value of values) {
    const storageKey = normalizeGroveStorageKey(value);

    if (storageKey) keys.add(storageKey);
  }

  return keys;
};

export const diffGroveResourceReferences = (
  previousReferences: Iterable<string>,
  nextReferences: Iterable<string>,
): GroveResourceReferenceDiff => {
  const previous = normalizeGroveStorageKeys(previousReferences);
  const next = normalizeGroveStorageKeys(nextReferences);

  return {
    added: [...next].filter((key) => !previous.has(key)).sort(),
    removed: [...previous].filter((key) => !next.has(key)).sort(),
    retained: [...previous].filter((key) => next.has(key)).sort(),
  };
};

/**
 * Selects only locally managed resources that were referenced before the
 * update and are not referenced by the next state.
 */
export const selectManagedGroveCleanupCandidates = <
  TResource extends ManagedGroveResourceLike,
>({
  resources,
  previousReferences,
  nextReferences,
}: {
  resources: Iterable<TResource>;
  previousReferences: Iterable<string>;
  nextReferences: Iterable<string>;
}): TResource[] => {
  const removed = new Set(
    diffGroveResourceReferences(previousReferences, nextReferences).removed,
  );
  const candidates = new Map<string, TResource>();

  for (const resource of resources) {
    const storageKey = normalizeGroveStorageKey(resource.storageKey);

    if (storageKey && removed.has(storageKey) && !candidates.has(storageKey)) {
      candidates.set(storageKey, resource);
    }
  }

  return [...candidates.values()].sort((left, right) =>
    left.storageKey.localeCompare(right.storageKey),
  );
};
