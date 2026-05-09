import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  Text,
} from '@/components/ui';

type ProfileCardProps = {
  address: string;
  avatar?: string;
  avatarFallback: string;
  coverPicture?: string;
  name: string;
  onSelect: () => void;
};

export const ProfileCard = ({
  address,
  avatar,
  avatarFallback,
  coverPicture,
  name,
  onSelect,
}: ProfileCardProps) => {
  return (
    <Card className="bg-background ring-muted w-full max-w-97 overflow-hidden rounded-4xl p-0 text-center shadow-none ring-1">
      <div
        className="bg-accent h-32 w-full bg-cover bg-center"
        style={
          coverPicture ? { backgroundImage: `url(${coverPicture})` } : undefined
        }
      />

      <div className="-mt-20 flex flex-col items-center px-6 pb-6">
        <Avatar size="xl" className="border-4 border-white shadow-sm">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>

        <div className="mt-4 flex w-full flex-col items-center gap-1">
          <Text variant="h3" className="text-foreground">
            {name}
          </Text>
          <Text className="text-xs">
            {address.slice(0, 6)}...{address.slice(-4)}
          </Text>
        </div>

        <Button type="button" className="mt-6" onClick={onSelect}>
          Select profile
        </Button>
      </div>
    </Card>
  );
};
