import { Avatar, AvatarFallback, AvatarImage, Text } from '@/components/ui';
import type { ThreeBioProfile } from '@/schemas/threeBioMetadata.schema';

export const Identity = ({
  lensHandle,
  profile,
}: {
  lensHandle: string;
  profile: Pick<ThreeBioProfile, 'avatar' | 'name' | 'bio'>;
}) => {
  const { avatar, name, bio } = profile;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Avatar
        size="xl"
        className="animate-[blurFadeIn_0.4s_ease-out_0.15s_backwards] after:border-transparent data-[size=xl]:size-28 motion-reduce:animate-none sm:data-[size=xl]:size-32"
      >
        <AvatarImage src={avatar} alt="" />
        <AvatarFallback className="bg-avatar-background text-avatar-foreground">
          {name
            ? name[0].toUpperCase()
            : lensHandle
              ? lensHandle[0].toUpperCase()
              : 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex animate-[blurFadeIn_0.4s_ease-out_0.30s_backwards] flex-col motion-reduce:animate-none">
        <Text
          variant="h1"
          className="text-name-text text-[1.75rem] leading-tight font-bold sm:text-[2rem]"
        >
          {name ?? `@${lensHandle}`}
        </Text>
        {bio && (
          <Text className="text-bio-text mt-4 max-w-97 whitespace-pre-line leading-[1.3]">
            {bio}
          </Text>
        )}
      </div>
    </div>
  );
};
