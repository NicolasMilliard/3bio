import {
  useAccount,
  useAccountsAvailable,
  useAuthenticatedUser,
  useLogout,
} from '@lens-protocol/react';
import { useNavigate } from '@tanstack/react-router';
import { useConnect, useConnection, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useLensLogin } from '../hooks/useLensLogin';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

export const AuthButton = () => {
  const navigate = useNavigate();

  const connect = useConnect();
  const connection = useConnection();
  const disconnect = useDisconnect();
  const { execute: lensLogout } = useLogout();

  const loginWithLens = useLensLogin();
  const { data: accounts } = useAccountsAvailable({
    managedBy: connection.address,
  });
  const { data: authenticatedUser } = useAuthenticatedUser();
  const { data: account } = useAccount({
    address: authenticatedUser?.address ?? '',
  });

  const handleDisconnect = async () => {
    try {
      if (authenticatedUser) {
        await lensLogout();
      }
    } catch (error) {
      console.warn('[AuthButton] Lens logout skipped:', error);
    } finally {
      await disconnect.mutateAsync();
      navigate({ to: '/dashboard' });
    }
  };

  if (!connection.isConnected) {
    return (
      <Button
        disabled={connect.isPending}
        onClick={() => connect.mutate({ connector: injected() })}
      >
        {connect.isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  const activeAddress = authenticatedUser?.address?.toLowerCase();
  const displayName =
    account?.metadata?.name ??
    account?.username?.value ??
    (activeAddress ? `${activeAddress.slice(0, 6)}...` : 'No profile selected');
  const avatarLetter = account?.metadata?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <div className="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs font-medium">
            {avatarLetter}
          </div>
          <span className="max-w-30 truncate">{displayName}</span>
          <span className="text-xs">▾</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-ring text-xs font-normal">
          Lens profiles
        </DropdownMenuLabel>

        {!accounts?.items.length ? (
          <DropdownMenuItem disabled className="text-ring text-sm">
            No Lens accounts
          </DropdownMenuItem>
        ) : (
          accounts.items.map((item) => {
            const isActive =
              activeAddress === item.account.address.toLowerCase();
            const label =
              item.account.username?.value ??
              `${item.account.address.slice(0, 6)}...`;

            return (
              <DropdownMenuItem
                key={item.account.address}
                onClick={() => !isActive && loginWithLens(item)}
                className={`gap-2 ${isActive ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="bg-background text-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {label[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="truncate">{label}</span>
                {isActive && (
                  <span className="text-ring ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
            );
          })
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-destructive hover:bg-destructive! hover:text-primary-foreground! cursor-pointer"
        >
          Disconnect wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
