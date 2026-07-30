import { Text } from '@/components/ui';
import { AuthButton } from '@/features/auth/components';

export const AuthScreen = () => {
  return (
    <section className="my-30 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <Text variant="h1">Connect your wallet</Text>
      <Text className="max-w-97">
        Access your 3bio dashboard by connecting your wallet. Your identity and
        profiles are linked to it.
      </Text>
      <AuthButton />
    </section>
  );
};
