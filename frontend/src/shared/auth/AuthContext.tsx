import { createContext, useContext } from 'react';

type AuthUser = Record<string, unknown> | null;

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}