import { Button, ErrorScreen } from '@/components/ui';

export const DeletedProfileEditorScreen = () => (
  <ErrorScreen
    title="Make this profile public before editing."
    description="This profile's 3bio data was deleted. Use Privacy & data on the dashboard to make it public before adding and saving new details."
  >
    <Button asChild>
      <a href="/app/dashboard">Open Privacy &amp; data</a>
    </Button>
  </ErrorScreen>
);
