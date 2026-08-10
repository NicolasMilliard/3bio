import {
  DndContext,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useFormContext, useWatch } from 'react-hook-form';

import { type PlatformName, SOCIAL_MAP } from '@/constants';
import { reorderActiveSocialLinks } from '@/features/editor/helpers/socialLinkOrdering';
import type { MetadataFormValues } from '@/features/editor/schemas/metadataForm.schema';
import { SortableEditableSocialIconLink } from './SortableEditableSocialIconLink';

const keyboardCodes = {
  start: [KeyboardCode.Space],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space],
};

const screenReaderInstructions = {
  draggable:
    'Press Enter to edit this social link. To reorder it, press Space to pick it up, use the arrow keys to move it, then press Space again to drop it. Press Escape to cancel.',
};

export const EditableSocialLinks = () => {
  const { control, setValue } = useFormContext<MetadataFormValues>();
  const socialLinks = useWatch({ control, name: 'socialLinks' });
  const activeSocialLinks = (socialLinks ?? []).flatMap((link) => {
    const platformName = link.platform as PlatformName;
    const platform = SOCIAL_MAP[platformName];

    return link.url && platform
      ? [
          {
            currentUrl: link.url,
            label: platform.label,
            platform: platformName,
            Icon: platform.Icon,
          },
        ]
      : [];
  });
  const canReorder = activeSocialLinks.length > 1;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes,
    }),
  );

  if (activeSocialLinks.length === 0) return null;

  const getPosition = (id: UniqueIdentifier) =>
    activeSocialLinks.findIndex(({ platform }) => platform === id) + 1;
  const getLabel = (id: UniqueIdentifier) =>
    SOCIAL_MAP[id as PlatformName]?.label ?? String(id);
  const announcements: Announcements = {
    onDragStart({ active }) {
      return `${getLabel(active.id)} picked up. Position ${getPosition(active.id)} of ${activeSocialLinks.length}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return undefined;

      return `${getLabel(active.id)} is now over position ${getPosition(over.id)} of ${activeSocialLinks.length}.`;
    },
    onDragEnd({ active, over }) {
      if (!over) return `${getLabel(active.id)} was not moved.`;

      return `${getLabel(active.id)} dropped at position ${getPosition(over.id)} of ${activeSocialLinks.length}.`;
    },
    onDragCancel({ active }) {
      return `Reordering ${getLabel(active.id)} was cancelled.`;
    },
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !socialLinks) return;

    setValue(
      'socialLinks',
      reorderActiveSocialLinks(
        socialLinks,
        active.id as PlatformName,
        over.id as PlatformName,
      ),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
  };

  return (
    <DndContext
      accessibility={{ announcements, screenReaderInstructions }}
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={activeSocialLinks.map(({ platform }) => platform)}
        strategy={rectSortingStrategy}
      >
        <ul
          aria-label="Active social links"
          className="flex max-w-prose flex-wrap items-center"
        >
          {activeSocialLinks.map(
            ({ currentUrl, label, platform, Icon }, index) => (
              <SortableEditableSocialIconLink
                key={platform}
                canReorder={canReorder}
                currentUrl={currentUrl}
                Icon={Icon}
                label={label}
                platform={platform}
                position={index + 1}
                total={activeSocialLinks.length}
              />
            ),
          )}
        </ul>
      </SortableContext>
    </DndContext>
  );
};
