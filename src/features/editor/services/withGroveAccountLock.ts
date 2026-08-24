const GROVE_ACCOUNT_LOCK_PREFIX = '3bio:grove-account';

type AccountLockManager = Pick<LockManager, 'request'>;

const resolveLockManager = (): AccountLockManager | null => {
  if (typeof navigator === 'undefined' || !('locks' in navigator)) return null;

  try {
    return navigator.locks;
  } catch {
    return null;
  }
};

/**
 * Serializes editor and privacy mutations for one Lens account across tabs
 * when the browser supports Web Locks. The fallback remains functional on
 * older browsers, while destructive cleanup still performs fresh reference
 * checks before every deletion.
 */
export const withGroveAccountLock = async <T>(
  accountAddress: string,
  task: () => Promise<T>,
  lockManager: AccountLockManager | null = resolveLockManager(),
): Promise<T> => {
  if (!lockManager) return task();

  const lockName = `${GROVE_ACCOUNT_LOCK_PREFIX}:${accountAddress.trim().toLowerCase()}`;

  return lockManager.request(lockName, { mode: 'exclusive' }, task);
};
