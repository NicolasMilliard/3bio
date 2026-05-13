import { Text } from '@/components/ui';
import { AddButtonLink, EditableButtonLinks } from './links';

export const ButtonLinks = () => {
  return (
    <div className="flex flex-col gap-2">
      <Text className="text-sidebar-foreground/70">Buttons</Text>
      <div>
        <EditableButtonLinks />
        <AddButtonLink />
      </div>
    </div>
  );
};
