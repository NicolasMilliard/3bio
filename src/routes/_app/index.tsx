import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <h1 className="mt-10 text-3xl font-bold">Web3 link-in-bio</h1>
    </div>
  );
}
