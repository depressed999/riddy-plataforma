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
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/auth-provider';

import { getHostDashboard, HostUnauthorizedError } from './host.service';
import type { HostDashboard } from './host.types';

type HostContextValue = {
  dashboard: HostDashboard | null;
  error: string;
  isLoading: boolean;
  refresh(): Promise<void>;
};

const HostContext = createContext<HostContextValue | null>(null);

export function HostProvider({ children }: { children: ReactNode }) {
  const { isLoading: isSessionLoading, user } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<HostDashboard | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      setDashboard(await getHostDashboard());
    } catch (caughtError) {
      if (caughtError instanceof HostUnauthorizedError) {
        router.replace('/entrar?next=/anfitriao');
        return;
      }
      setError(messageFrom(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }
    if (!user) {
      router.replace('/entrar?next=/anfitriao');
      return;
    }
    let active = true;
    void getHostDashboard()
      .then((response) => {
        if (active) {
          setDashboard(response);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof HostUnauthorizedError) {
          router.replace('/entrar?next=/anfitriao');
          return;
        }
        if (active) {
          setError(messageFrom(caughtError));
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
  }, [isSessionLoading, router, user]);

  const value = useMemo(
    () => ({
      dashboard,
      error,
      isLoading: isLoading || isSessionLoading,
      refresh,
    }),
    [dashboard, error, isLoading, isSessionLoading, refresh],
  );
  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}

export function useHost(): HostContextValue {
  const context = useContext(HostContext);
  if (!context) {
    throw new Error('useHost must be used within HostProvider.');
  }
  return context;
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar a área do anfitrião.';
}
