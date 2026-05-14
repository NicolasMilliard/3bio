import { Avatar, AvatarFallback, AvatarImage, Text } from '@/components/ui';
import type { InBioProfile } from '@/schemas/inBioMetadata.schema';

export const Identity = ({
  lensHandle,
  profile,
}: {
  lensHandle: string;
  profile: InBioProfile;
}) => {
  const { avatar, name, bio } = profile;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Avatar
        size="xl"
        className="animate-[blurFadeIn_0.4s_ease-out_0.15s_both]"
      >
        <AvatarImage src={avatar} alt={name ?? lensHandle} />
        <AvatarFallback>
          {name
            ? name[0].toUpperCase()
            : lensHandle
              ? lensHandle[0].toUpperCase()
              : 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex animate-[blurFadeIn_0.4s_ease-out_0.30s_both] flex-col items-center">
        {name && (
          <Text variant="h1" className="text-2xl leading-tight font-bold">
            {name}
          </Text>
        )}
        {bio && (
          <Text className="mt-2 max-w-prose leading-relaxed tracking-tight">
            {bio}
          </Text>
        )}
      </div>
    </div>
  );
};
