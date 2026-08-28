'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from './auth.service';
import type { AuthUser } from './auth.types';

type AuthContextValue = {
  isLoading: boolean;
  login(input: { email: string; password: string }): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  register(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<void>;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getCurrentUser()
      .then((response) => {
        if (active) {
          setUser(response?.user ?? null);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const response = await loginRequest(input);
      setUser(response.user);
    },
    [],
  );

  const register = useCallback(
    async (input: { email: string; name: string; password: string }) => {
      const response = await registerRequest(input);
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const response = await getCurrentUser();
    setUser(response?.user ?? null);
  }, []);

  const value = useMemo(
    () => ({ isLoading, login, logout, refresh, register, user }),
    [isLoading, login, logout, refresh, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
