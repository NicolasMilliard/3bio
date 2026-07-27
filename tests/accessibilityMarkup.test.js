import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { SpinnerScreen } from '../src/components/ui/SpinnerScreen.tsx';
import { ProfileCheckingForm } from '../src/features/homepage/components/ProfileCheckingForm.tsx';

test('homepage profile form exposes a real label and new-tab notice', () => {
  const markup = renderToStaticMarkup(createElement(ProfileCheckingForm));
  const label = markup.match(
    /<label for="([^"]+)" class="sr-only">Lens profile handle<\/label>/,
  );

  expect(label).not.toBeNull();
  expect(markup).toContain(`id="${label?.[1]}"`);
  expect(markup).toContain('aria-describedby=');
  expect(markup).toContain('(opens in a new tab)');
  expect(markup).toContain('motion-reduce:opacity-100');
});

test('full-page loading state provides one specific live status landmark', () => {
  const markup = renderToStaticMarkup(
    createElement(SpinnerScreen, {
      as: 'main',
      text: 'Loading profile...',
    }),
  );

  expect(markup).toStartWith('<main class=');
  expect(markup).toContain('role="status" aria-live="polite"');
  expect(markup).toContain('aria-hidden="true"');
  expect(markup).toContain('Loading profile...');
});
