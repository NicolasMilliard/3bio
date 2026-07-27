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
  Spinner,
} from '@/components/ui';
import { ChevronDownIcon } from 'lucide-react';

export const AuthButton = () => {
  const {
    isConnected,
    profiles,
    activeDisplayName,
    activeAvatar,
    connectWallet,
    disconnectWallet,
    switchProfile,
    profilesLoading,
    profilesError,
    isConnecting,
    isDisconnecting,
    switchingProfileAddress,
  } = useAuthState();

  if (!isConnected) {
    return (
      <Button
        disabled={isConnecting || isDisconnecting}
        onClick={connectWallet}
      >
        {isDisconnecting
          ? 'Disconnecting...'
          : isConnecting
            ? 'Connecting...'
            : 'Connect Wallet'}
      </Button>
    );
  }

  const activeLabel = profilesLoading
    ? 'Loading profiles...'
    : switchingProfileAddress
      ? 'Switching profile...'
      : profilesError
        ? 'Profiles unavailable'
        : activeDisplayName;
  const profileActionPending = switchingProfileAddress !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isDisconnecting || profileActionPending}>
          {activeAvatar && (
            <Image
              src={activeAvatar}
              alt={activeDisplayName}
              className="size-6 rounded-full object-cover"
            />
          )}
          {profilesLoading || profileActionPending ? <Spinner /> : null}
          <span className="truncate">{activeLabel}</span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground font-semibold tracking-wider uppercase">
          Your profiles
        </DropdownMenuLabel>

        {profilesLoading && (
          <DropdownMenuItem disabled>
            <Spinner />
            Loading profiles...
          </DropdownMenuItem>
        )}

        {!profilesLoading && profilesError && (
          <DropdownMenuItem disabled>
            Couldn&apos;t load profiles
          </DropdownMenuItem>
        )}

        {!profilesLoading && !profilesError && profiles.length === 0 && (
          <DropdownMenuItem disabled>No Lens profiles found</DropdownMenuItem>
        )}

        {!profilesLoading &&
          !profilesError &&
          profiles.map((p) => (
            <DropdownMenuItem
              key={p.address}
              disabled={profileActionPending}
              onClick={() => void switchProfile(p.address)}
              className={
                p.isActive ? 'bg-muted hover:bg-muted!' : 'hover:bg-primary/40!'
              }
            >
              <Avatar size="sm">
                <AvatarImage src={p.avatar} alt={p.displayName} />
                <AvatarFallback>
                  {p.displayName ? p.displayName[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{p.displayName}</span>

              {switchingProfileAddress === p.address ? (
                <Spinner className="ml-auto" />
              ) : null}
              {p.isActive && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => void disconnectWallet()}
          disabled={isDisconnecting || profileActionPending}
          className="text-destructive hover:bg-destructive! hover:text-primary-foreground!"
        >
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
