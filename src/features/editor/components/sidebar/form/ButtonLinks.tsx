import { Text } from '@/components/ui';
import { AddButtonLink, EditableButtonLinks } from './links';

export const ButtonLinks = () => {
  return (
    <div>
      <Text className="text-sidebar-foreground mb-1 text-sm font-medium">
        Links
      </Text>
      <div>
        <EditableButtonLinks />
        <AddButtonLink />
      </div>
    </div>
  );
};
