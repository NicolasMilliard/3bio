import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { SpinnerScreen } from '../src/components/ui/SpinnerScreen.tsx';
import { HeroSection } from '../src/features/homepage/components/HeroSection.tsx';
import { ProfileCheckingForm } from '../src/features/homepage/components/ProfileCheckingForm.tsx';
import { LinkButton } from '../src/features/profile/components/LinkButton.tsx';
import { ProfileLayout } from '../src/features/profile/components/ProfileLayout.tsx';

test('homepage hero labels its content and keeps the visual decorative', () => {
  const markup = renderToStaticMarkup(createElement(HeroSection));

  expect(markup).toContain('aria-labelledby="home-hero-title"');
  expect(markup).toContain('id="home-hero-title"');
  expect(markup).toContain('aria-hidden="true" data-hero-visual="true"');
  expect(markup).not.toContain('<img');
  expect(markup).not.toContain('@miravale');
  expect(markup).toContain('data-hero-layer="socials"');
  expect(markup).toContain('data-hero-layer="link-3"');
});

test('profile links use the branded canvas without changing link semantics', () => {
  const markup = renderToStaticMarkup(
    createElement(ProfileLayout, {
      lensHandle: 'miravale',
      profile: {
        name: 'Mira Vale',
        links: [{ key: 'portfolio', value: 'https://example.com/work' }],
      },
      displayStatistics: false,
      displayBranding: false,
      mode: 'preview',
    }),
  );

  expect(markup).toContain('aria-label="Profile links"');
  expect(markup).toContain('profile-links-canvas');
  expect(markup).toContain('focus-visible:ring-name-text');
  expect(markup).toContain('aria-label="External links"');
});

test('editor links use a distinct surface without moving the external icon', () => {
  const markup = renderToStaticMarkup(
    createElement(LinkButton, {
      as: 'button',
      label: 'example.com',
      surface: 'editor',
    }),
  );

  expect(markup).toContain('bg-sidebar-accent');
  expect(markup).toContain('bg-accent');
  expect(markup).toContain('focus-visible:ring-sidebar-ring');
  expect(markup).not.toContain('group-hover:translate-x');
  expect(markup).not.toContain('transition-transform');
});

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
