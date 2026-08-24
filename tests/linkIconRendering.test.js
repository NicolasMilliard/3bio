import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { LinkButton } from '../src/features/profile/components/LinkButton.tsx';

test('profile links use a local icon without requesting the destination favicon', () => {
  const markup = renderToStaticMarkup(
    createElement(LinkButton, {
      href: 'https://creator.example',
      label: 'creator.example',
    }),
  );

  expect(markup).not.toContain('<img');
  expect(markup).not.toContain('/favicon.');
  expect(markup).toContain('lucide-link-2');
  expect(markup).toContain('rel="ugc noopener noreferrer"');
});

test('preview links use the same request-free local icon', () => {
  const markup = renderToStaticMarkup(
    createElement(LinkButton, {
      href: 'https://creator.example',
      label: 'creator.example',
      interactive: false,
    }),
  );

  expect(markup).not.toContain('<img');
  expect(markup).not.toContain('/favicon.');
  expect(markup).toContain('bg-links-icon-background');
});

test('the application keeps its own same-origin favicon', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  expect(html).toContain(
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
  );
});
