import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Badge } from '../src/components/ui/badge.tsx';
import { Button } from '../src/components/ui/button.tsx';
import { Card } from '../src/components/ui/card.tsx';
import {
  InputGroup,
  InputGroupButton,
} from '../src/components/ui/input-group.tsx';
import { Input } from '../src/components/ui/input.tsx';
import { Skeleton } from '../src/components/ui/skeleton.tsx';
import { Textarea } from '../src/components/ui/textarea.tsx';

const sharedRadiusFiles = [
  'Image.tsx',
  'badge.tsx',
  'button.tsx',
  'card.tsx',
  'command.tsx',
  'dialog.tsx',
  'dropdown-menu.tsx',
  'field.tsx',
  'input-group.tsx',
  'input.tsx',
  'popover.tsx',
  'select.tsx',
  'sidebar.tsx',
  'skeleton.tsx',
  'textarea.tsx',
  'toggle.tsx',
  'tooltip.tsx',
];

const featureSurfaceFiles = [
  '../src/features/auth/components/ProfileCard.tsx',
  '../src/features/auth/components/ProfileSelectionScreen.tsx',
  '../src/features/homepage/components/CreatorRightsSection.tsx',
  '../src/features/homepage/components/HeroVisual.tsx',
  '../src/features/profile/components/LinkButton.tsx',
  '../src/features/profile/components/ProfileLayout.tsx',
  '../src/features/profile/components/SocialLinks.tsx',
  '../src/features/profile/components/Statistics.tsx',
];

test('shared primitives expose the compact project radius hierarchy', () => {
  const action = renderToStaticMarkup(createElement(Button, null, 'Action'));
  const iconAction = renderToStaticMarkup(
    createElement(Button, { size: 'icon', 'aria-label': 'Icon action' }),
  );
  const input = renderToStaticMarkup(createElement(Input));
  const textarea = renderToStaticMarkup(createElement(Textarea));
  const inputGroup = renderToStaticMarkup(createElement(InputGroup));
  const inputGroupIcon = renderToStaticMarkup(
    createElement(InputGroupButton, { size: 'icon-sm' }),
  );
  const card = renderToStaticMarkup(createElement(Card));
  const badge = renderToStaticMarkup(createElement(Badge, null, 'New'));
  const skeleton = renderToStaticMarkup(createElement(Skeleton));

  expect(action).toContain('rounded-lg');
  expect(iconAction).toContain('rounded-md');
  expect(input).toContain('rounded-lg');
  expect(textarea).toContain('rounded-lg');
  expect(inputGroup).toContain('rounded-lg');
  expect(inputGroupIcon).toContain('rounded-md');
  expect(card).toContain('rounded-xl');
  expect(badge).toContain('rounded-full');
  expect(skeleton).toContain('rounded-lg');
});

test('shared surface defaults do not reintroduce oversized radii', () => {
  for (const file of sharedRadiusFiles) {
    const source = readFileSync(
      new URL(`../src/components/ui/${file}`, import.meta.url),
      'utf8',
    );

    expect(source.match(/rounded-(?:2xl|3xl|4xl)/g) ?? []).toEqual([]);
  }
});

test('feature surfaces do not override the compact scale with oversized radii', () => {
  for (const file of featureSurfaceFiles) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');

    expect(source.match(/rounded-(?:2xl|3xl|4xl|\[)/g) ?? []).toEqual([]);
  }
});

test('toast surfaces use the shared surface radius token', () => {
  const source = readFileSync(
    new URL('../src/components/ui/sonner.tsx', import.meta.url),
    'utf8',
  );

  expect(source).toContain('"--border-radius": "var(--radius-xl)"');
});
