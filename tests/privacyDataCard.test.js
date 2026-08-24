import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PrivacyDataCard } from '../src/features/privacy/components/PrivacyDataCard.tsx';

const noop = () => {};

const renderCard = (props = {}) =>
  renderToStaticMarkup(
    createElement(PrivacyDataCard, {
      publicationStatus: 'public',
      busyAction: null,
      managedResourceCount: 2,
      onMakePublic: noop,
      onOptOut: noop,
      onDeleteData: noop,
      onCleanup: noop,
      ...props,
    }),
  );

test('privacy card presents publication and managed Grove resource controls', () => {
  const markup = renderCard();

  expect(markup).toContain('aria-labelledby=');
  expect(markup).toContain('Privacy &amp; data');
  expect(markup).toContain('Your 3bio page is visible');
  expect(markup).toContain('>Public<');
  expect(markup).toContain('Hide profile');
  expect(markup).not.toContain('Make profile public');
  expect(markup).toContain(
    '2 image cleanup candidates recorded in this browser',
  );
  expect(markup).toContain('Clean up 2 images');
});

test('privacy card reflects opt-out and busy action states accessibly', () => {
  const markup = renderCard({
    publicationStatus: 'opted-out',
    busyAction: 'make-public',
    managedResourceCount: 1,
  });

  expect(markup).toContain('>Hidden<');
  expect(markup).toContain('settings are preserved');
  expect(markup).toContain('aria-busy="true"');
  expect(markup).toContain('Publishing profile...');
  expect(markup).toContain(
    '1 image cleanup candidate recorded in this browser',
  );
  expect(markup).toContain('Clean up 1 image');
});

test('privacy card distinguishes an unavailable local cleanup record', () => {
  const markup = renderCard({ cleanupAvailable: false });

  expect(markup).toContain(
    'This browser&#x27;s Grove cleanup record is unavailable.',
  );
  expect(markup).toContain('Cleanup unavailable');
  expect(markup).toContain('disabled=""');
});

test('privacy confirmations qualify opt-out, deletion, and cleanup limits', () => {
  const source = readFileSync(
    new URL(
      '../src/features/privacy/components/PrivacyDataCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  expect(source).toContain(
    'Opting out hides your public 3bio page but preserves your current settings',
  );
  expect(source).toContain(
    'attempts to delete only Grove images recorded as app-managed',
  );
  expect(source).toContain('may require one wallet signature per image');
  expect(source).toContain(
    'Lens and on-chain history, caches, and third-party copies cannot be erased',
  );
});

test('dashboard resolves the active account before mounting privacy actions', () => {
  const source = readFileSync(
    new URL(
      '../src/features/dashboard/components/DashboardScreen.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  expect(source).toContain('const DashboardPrivacyControls');
  expect(source).toContain('usePrivacyData(account)');
  expect(source).toContain('const DashboardPrivacyCard');
  expect(source).toContain('useEditorAccount()');
  expect(source).toContain('if (loading)');
  expect(source).toContain('if (error || !account)');
  expect(source).toContain('key={account.address.toLowerCase()}');
  expect(source).toContain('account={account}');
  expect(source).toContain('onMakePublic={makePublic}');
  expect(source).toContain('cleanupAvailable={cleanupAvailable}');
  expect(source).toContain('onCleanup={cleanup}');

  const hookSource = readFileSync(
    new URL('../src/features/privacy/hooks/usePrivacyData.ts', import.meta.url),
    'utf8',
  );
  expect(hookSource).toContain('isExpectedAccount(refreshedAccount.value');
  expect(hookSource).toContain('isExpectedAccount(latestAccount.value');
});

test('privacy confirmations keep a stable focus target during wallet work', () => {
  const source = readFileSync(
    new URL(
      '../src/features/privacy/components/PrivacyDataCard.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  expect(source).not.toContain('setOpen(false);\n    onConfirm();');
  expect(source).toContain('if (!hasBusyAction) setOpen(nextOpen)');
  expect(source).toContain('disabled={hasBusyAction}');
  expect(source).toContain('invocationPending');
  expect(source).toContain('showCloseButton={!hasBusyAction}');
  expect(source).toContain('aria-live="polite"');
  expect(source).toContain('aria-disabled={hasBusyAction}');
});
