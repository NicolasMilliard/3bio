import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormProvider, useForm } from 'react-hook-form';

import { SpinnerScreen } from '../src/components/ui/SpinnerScreen.tsx';
import { EditableSocialLinks } from '../src/features/editor/components/sidebar/form/social-links/EditableSocialIconLinks.tsx';
import { CreatorRightsSection } from '../src/features/homepage/components/CreatorRightsSection.tsx';
import { HeroSection } from '../src/features/homepage/components/HeroSection.tsx';
import { calculateHeroTilt } from '../src/features/homepage/components/heroMotion.ts';
import { ProfileCheckingForm } from '../src/features/homepage/components/ProfileCheckingForm.tsx';
import { LinkButton } from '../src/features/profile/components/LinkButton.tsx';
import { ProfileLayout } from '../src/features/profile/components/ProfileLayout.tsx';

const EditorSocialLinksHarness = ({ socialLinks }) => {
  const methods = useForm({ defaultValues: { socialLinks } });

  return createElement(
    FormProvider,
    methods,
    createElement(EditableSocialLinks),
  );
};

test('homepage hero labels its content and keeps the visual decorative', () => {
  const markup = renderToStaticMarkup(createElement(HeroSection));

  expect(markup).toContain('aria-labelledby="home-hero-title"');
  expect(markup).toContain('id="home-hero-title"');
  expect(markup).toContain('aria-hidden="true" data-hero-visual="true"');
  expect(markup).not.toContain('<img');
  expect(markup).not.toContain('@miravale');
  expect(markup).toContain('data-hero-layer="socials"');
  expect(markup).toContain('data-hero-layer="link-3"');
  expect(markup).toContain('data-hero-motion="ambient"');
  expect(markup).toContain('data-hero-tilt="true"');
  expect(markup).toContain('hero-visual-enter');
  expect(markup).toContain('hero-profile-tilt');
});

test('hero card tilt is neutral at center and capped at its corners', () => {
  expect(calculateHeroTilt(100, 50, 200, 100)).toEqual({
    rotateX: 0,
    rotateY: 0,
  });
  expect(calculateHeroTilt(200, 0, 200, 100)).toEqual({
    rotateX: 3.5,
    rotateY: 4.5,
  });
  expect(calculateHeroTilt(-20, 140, 200, 100)).toEqual({
    rotateX: -3.5,
    rotateY: -4.5,
  });
  expect(calculateHeroTilt(10, 10, 0, 0)).toEqual({
    rotateX: 0,
    rotateY: 0,
  });
});

test('creator rights reveal preserves the section and list semantics', () => {
  const markup = renderToStaticMarkup(createElement(CreatorRightsSection));

  expect(markup).toContain('aria-labelledby="creator-rights-title"');
  expect(markup).toContain('id="creator-rights-title"');
  expect(markup).toContain('data-creator-rights-reveal="true"');
  expect(markup).toContain('data-creator-rights-motion="panel"');
  expect(markup).toContain('data-creator-rights-motion="header"');
  expect(markup).toContain('data-creator-rights-row="3"');
  expect(markup.match(/data-creator-rights-motion="row"/g)).toHaveLength(3);
  expect(markup).toContain('<ol');
});

test('pricing reveal keeps its heading and complete plan card together', () => {
  const source = readFileSync(
    new URL(
      '../src/features/homepage/components/PricingSection.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  expect(source).toContain('aria-labelledby="pricing-title"');
  expect(source).toContain('id="pricing-title"');
  expect(source).toContain('data-pricing-reveal');
  expect(source).toContain('data-pricing-motion="header"');
  expect(source).toContain('data-pricing-motion="card"');
  expect(source).not.toContain('data-pricing-motion="feature"');
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

test('preview and public profiles preserve multiline bios as plain text', () => {
  for (const mode of ['preview', 'public']) {
    const markup = renderToStaticMarkup(
      createElement(ProfileLayout, {
        lensHandle: 'miravale',
        profile: {
          name: 'Mira Vale',
          bio: 'First line\nSecond line <strong>not bold</strong>',
        },
        displayStatistics: false,
        displayBranding: false,
        mode,
      }),
    );

    expect(markup).toContain('whitespace-pre-line');
    expect(markup).toContain(
      'First line\nSecond line &lt;strong&gt;not bold&lt;/strong&gt;',
    );
    expect(markup).not.toContain('<strong>not bold</strong>');
  }
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
  expect(markup).toContain('bg-links-icon-background');
  expect(markup).toContain('text-links-icon');
  expect(markup.match(/bg-links-icon-background/g)).toHaveLength(2);
  expect(markup).not.toContain('bg-accent');
  expect(markup).not.toContain('<img');
  expect(markup).toContain('focus-visible:ring-sidebar-ring');
  expect(markup).not.toContain('group-hover:translate-x');
  expect(markup).not.toContain('transition-transform');
});

test('editor social icons expose sortable keyboard and screen reader semantics', () => {
  const markup = renderToStaticMarkup(
    createElement(EditorSocialLinksHarness, {
      socialLinks: [
        { platform: 'github', url: 'https://github.com/alice' },
        { platform: 'youtube', url: 'https://youtube.com/@alice' },
        { platform: 'twitter', url: undefined },
      ],
    }),
  );

  expect(markup).toContain('aria-label="Active social links"');
  expect(markup).toContain('data-social-platform="github"');
  expect(markup).toContain(
    'aria-label="Edit or reorder GitHub social link, position 1 of 2"',
  );
  expect(markup).toContain('aria-roledescription="sortable"');
  expect(markup).toContain('touch-none');
  expect(markup).not.toContain('data-social-platform="twitter"');

  const source = readFileSync(
    new URL(
      '../src/features/editor/components/sidebar/form/social-links/EditableSocialIconLinks.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  expect(source).toContain('Press Enter to edit this social link.');
  expect(source).toContain('use the arrow keys to move it');
});

test('a single active social icon remains an explicitly named edit control', () => {
  const markup = renderToStaticMarkup(
    createElement(EditorSocialLinksHarness, {
      socialLinks: [
        { platform: 'github', url: 'https://github.com/alice' },
        { platform: 'youtube', url: undefined },
      ],
    }),
  );

  expect(markup).toContain('aria-label="Edit GitHub social link"');
  expect(markup).not.toContain('aria-roledescription="sortable"');
});

test('editor sidebar toggle follows the sidebar and reopens from the mobile preview', () => {
  const editorScreen = readFileSync(
    new URL(
      '../src/features/editor/components/EditorScreen.tsx',
      import.meta.url,
    ),
    'utf8',
  );
  const sidebarEditor = readFileSync(
    new URL(
      '../src/features/editor/components/SidebarEditor.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  expect(sidebarEditor).toContain('absolute top-4 left-full');
  expect(sidebarEditor).toContain(' ml-4');
  expect(sidebarEditor).not.toContain('md:ml-4');
  expect(editorScreen).toContain('!openMobile');
  expect(editorScreen).toContain('fixed top-4 left-4');
  expect(editorScreen).toContain('md:hidden');
  expect(editorScreen).not.toContain('right-4');
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
