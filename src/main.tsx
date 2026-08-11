import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';

import { routeTree } from './routeTree.gen.ts';

import { LensProvider } from '@lens-protocol/react';
import { client, wagmiConfig } from './lib';
import { AuthProvider } from './providers/AuthProvider.tsx';

import './styles/index.css';

const router = createRouter({ routeTree, notFoundMode: 'root' });
const queryClient = new QueryClient();

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LensProvider client={client}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </LensProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
