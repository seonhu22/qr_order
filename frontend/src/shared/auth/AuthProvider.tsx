import type { PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { resolveAuthUser } from '@/shared/auth/authResponse';
import { AuthContext } from '@/shared/auth/AuthContext';
import { useCurrentUser } from '@/shared/auth/hooks/useCurrentUser';

type AuthUser = Record<string, unknown> | null;

function normalizeAuthUser(user: unknown): AuthUser {
  return user && typeof user === 'object' ? user as Record<string, unknown> : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useCurrentUser();
  const user = normalizeAuthUser(resolveAuthUser(data));
  const isAuthenticated = !!user;

  const signIn = (nextUser: AuthUser) => {
    queryClient.setQueryData(queryKeys.auth.me, {
      success: true,
      data: nextUser ?? null,
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
