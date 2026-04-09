import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { resolveAuthUser } from '@/shared/auth/authResponse';
import { AuthContext } from '@/shared/auth/AuthContext';
import { useCurrentUser } from '@/shared/auth/hooks/useCurrentUser';

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useCurrentUser();
  const user = resolveAuthUser(data);
  const isAuthenticated = !!user;

  const signIn = (user) => {
    queryClient.setQueryData(queryKeys.auth.me, {
      success: true,
      data: user ?? null,
    });
  };

  const signOut = () => {
    queryClient.setQueryData(queryKeys.auth.me, {
      success: false,
      data: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
