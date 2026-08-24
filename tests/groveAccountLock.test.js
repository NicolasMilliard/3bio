import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

import { withGroveAccountLock } from '../src/features/editor/services/withGroveAccountLock.ts';

test('account-scoped Grove work uses an exclusive normalized browser lock', async () => {
  const requests = [];
  const lockManager = {
    request: async (name, options, callback) => {
      requests.push({ name, options });
      return callback();
    },
  };

  const result = await withGroveAccountLock(
    ' 0xABCDEF ',
    async () => 'complete',
    lockManager,
  );

  expect(result).toBe('complete');
  expect(requests).toEqual([
    {
      name: '3bio:grove-account:0xabcdef',
      options: { mode: 'exclusive' },
    },
  ]);
});

test('editor saves and privacy mutations share the account lock', () => {
  const editorSource = readFileSync(
    new URL('../src/features/editor/hooks/useEditorSave.ts', import.meta.url),
    'utf8',
  );
  const privacySource = readFileSync(
    new URL('../src/features/privacy/hooks/usePrivacyData.ts', import.meta.url),
    'utf8',
  );

  expect(editorSource).toContain('withGroveAccountLock(account.address');
  expect(
    privacySource.match(/withGroveAccountLock\(account\.address/g),
  ).toHaveLength(2);
});
