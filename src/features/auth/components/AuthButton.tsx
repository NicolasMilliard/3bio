import { useAuthState } from '../hooks';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Image,
} from '@/components/ui';

export const AuthButton = () => {
  const {
    isConnected,
    profiles,
    activeDisplayName,
    activeAvatar,
    connectWallet,
    disconnectWallet,
    switchProfile,
    isConnecting,
    isDisconnecting,
  } = useAuthState();

  if (!isConnected) {
    return (
      <Button disabled={isConnecting} onClick={connectWallet}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          {activeAvatar && (
            <Image
              src={activeAvatar}
              alt={activeDisplayName}
              className="size-6 rounded-full object-cover"
            />
          )}
          <span className="truncate">{activeDisplayName}</span>
          <span className="text-xs">▾</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground font-semibold tracking-wider uppercase">
          Your profiles
        </DropdownMenuLabel>

        {profiles.length === 0 && (
          <DropdownMenuItem disabled>No profiles</DropdownMenuItem>
        )}

        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.address}
            onClick={() => switchProfile(p.address)}
            className={
              p.isActive
                ? 'bg-muted hover:bg-muted!'
                : 'hover:bg-primary/40! cursor-pointer'
            }
          >
            <Avatar size="sm">
              <AvatarImage src={p.avatar} alt={p.displayName} />
              <AvatarFallback>
                {p.displayName ? p.displayName[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{p.displayName}</span>

            {p.isActive && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={disconnectWallet}
          disabled={isDisconnecting}
          className="text-destructive hover:bg-destructive! hover:text-primary-foreground! cursor-pointer"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
