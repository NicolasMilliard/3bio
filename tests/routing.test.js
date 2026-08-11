import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

const readSource = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('internal pages live under the app namespace while public handles stay top-level', () => {
  const routeTree = readSource('../src/routeTree.gen.ts');
  const fullPaths = routeTree.match(
    /export interface FileRoutesByFullPath \{([\s\S]*?)\n\}/,
  )?.[1];

  expect(fullPaths).toBeDefined();
  expect(fullPaths).toContain("'/app':");
  expect(fullPaths).toContain("'/app/dashboard':");
  expect(fullPaths).toContain("'/app/edit/':");
  expect(fullPaths).toContain("'/$pageId/':");
  expect(fullPaths).not.toContain("'/dashboard':");
  expect(fullPaths).not.toContain("'/edit/':");
});

test('the app index preserves the public app handle', () => {
  const appIndex = readSource('../src/routes/app/index.tsx');

  expect(appIndex).toContain('<UserProfile lensHandle="app" />');
  expect(appIndex).not.toContain('redirect(');
  expect(appIndex).not.toContain("to: '/app/dashboard'");
});

test('nested unknown app paths resolve through the root not-found boundary', async () => {
  const rootRoute = createRootRoute({
    component: () => null,
    notFoundComponent: () => null,
  });
  const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'app',
    component: () => null,
  });
  const dashboardRoute = createRoute({
    getParentRoute: () => appRoute,
    path: 'dashboard',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([
    appRoute.addChildren([dashboardRoute]),
  ]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/app/unknown'] }),
    notFoundMode: 'root',
  });

  await router.load();

  expect(
    router.state.matches.find((match) => match.routeId === '__root__')
      ?.globalNotFound,
  ).toBe(true);
  expect(
    router.state.matches.find((match) => match.routeId === '/app')
      ?.globalNotFound,
  ).toBe(false);
});

test('the root not-found boundary clears stale metadata and emits noindex', () => {
  const main = readSource('../src/main.tsx');
  const rootRoute = readSource('../src/routes/__root.tsx');

  expect(main).toContain("notFoundMode: 'root'");
  expect(rootRoute).toContain('notFoundComponent: RootNotFoundScreen');
  expect(rootRoute).toContain('useClearServerMetadata();');
  expect(rootRoute).toContain('useDocumentTitle(PAGE_NOT_FOUND_TITLE);');
  expect(rootRoute).toContain('<title>{PAGE_NOT_FOUND_TITLE}</title>');
  expect(rootRoute).toContain(
    '<meta name="robots" content={NOINDEX_ROBOTS} />',
  );
  expect(rootRoute).toContain('<Link to="/">Go back home</Link>');
});
