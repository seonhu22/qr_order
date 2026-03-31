import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';
import { AuthContext } from '@/shared/auth/AuthContext';

function resolveUser(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload.user ?? payload.data ?? payload;
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        if (data?.success) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: resolveUser(data),
          });
          return;
        }

        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = (user) => {
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: user ?? null,
    });
  };

  const signOut = () => {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}