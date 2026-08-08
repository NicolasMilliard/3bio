import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { LinkButton } from '../src/features/profile/components/LinkButton.tsx';
import {
  getFaviconCandidates,
  getNextFaviconCandidate,
} from '../src/helpers/getFaviconCandidates.ts';

test('favicon candidates preserve transparent formats before legacy ICO files', () => {
  const candidates = getFaviconCandidates('https://creator.example/about');

  expect(candidates).toEqual([
    'https://creator.example/favicon.svg',
    'https://creator.example/favicon.png',
    'https://creator.example/favicon.ico',
  ]);
  expect(getNextFaviconCandidate(candidates, candidates[0])).toBe(
    candidates[1],
  );
  expect(getNextFaviconCandidate(candidates, candidates[1])).toBe(
    candidates[2],
  );
  expect(getNextFaviconCandidate(candidates, candidates[2])).toBeNull();
  expect(getNextFaviconCandidate(candidates, null)).toBe(candidates[0]);
});

test('favicon candidates are HTTPS-only and reject unrelated URL schemes', () => {
  expect(getFaviconCandidates('http://example.com:8080/profile')[0]).toBe(
    'https://example.com:8080/favicon.svg',
  );
  expect(getFaviconCandidates('javascript:alert(1)')).toEqual([]);
  expect(getFaviconCandidates('not a URL')).toEqual([]);
});

test('profile links render the original SVG candidate without an image proxy', () => {
  const markup = renderToStaticMarkup(
    createElement(LinkButton, {
      href: 'https://creator.example',
      label: 'creator.example',
    }),
  );

  expect(markup).toContain('src="https://creator.example/favicon.svg"');
  expect(markup).toContain('referrerPolicy="no-referrer"');
  expect(markup).not.toContain('google.com/s2/favicons');
});

test('preview links do not make favicon requests', () => {
  const markup = renderToStaticMarkup(
    createElement(LinkButton, {
      href: 'https://creator.example',
      label: 'creator.example',
      interactive: false,
      loadFavicon: false,
    }),
  );

  expect(markup).not.toContain('<img');
  expect(markup).toContain('bg-links-icon-background');
});
