import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { DeletedProfileEditorScreen } from '../src/features/editor/components/DeletedProfileEditorScreen.tsx';

test('deleted profiles render a dashboard recovery message instead of the editor', () => {
  const markup = renderToStaticMarkup(
    createElement(DeletedProfileEditorScreen),
  );
  const editorScreenSource = readFileSync(
    new URL(
      '../src/features/editor/components/EditorScreen.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  expect(markup).toContain('Make this profile public before editing.');
  expect(markup).toContain('Privacy &amp; data on the dashboard');
  expect(markup).toContain('href="/app/dashboard"');
  expect(markup).toContain('Open Privacy &amp; data');
  expect(markup).not.toContain('<form');
  expect(editorScreenSource).toContain(
    "threeBioMetadata.publication?.status === 'deleted'",
  );
  expect(editorScreenSource).toContain(
    'return <DeletedProfileEditorScreen />;',
  );
});
