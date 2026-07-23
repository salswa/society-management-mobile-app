import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/auth';
import { setAuthHandlers } from '@/api/client';
import { queryClient } from '@/query/queryClient';
import type { Profile, Session } from '@/api/types';
import { clearSession, loadSession, saveSession } from './storage';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

/** Which experience an admin is currently viewing. Only meaningful for admins
 *  who also have a flat; `null` = not yet chosen this session (show the chooser). */
export type ViewMode = 'admin' | 'resident';

type AuthContextValue = {
  status: Status;
  profile: Profile | null;
  viewMode: ViewMode | null;
  setViewMode: (mode: ViewMode) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refetchProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  // In-memory only: an admin re-picks their view on each fresh login/launch.
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);

  const localSignOut = useCallback(async () => {
    sessionRef.current = null;
    await clearSession();
    setProfile(null);
    setViewMode(null);
    setStatus('unauthenticated');
    // Drop every cached query so the next user never sees the previous one's data.
    queryClient.clear();
  }, []);

  const setSession = useCallback(async (session: Session) => {
    sessionRef.current = session;
    await saveSession(session);
  }, []);

  // Wire the API client so it can attach the token and refresh on 401.
  useEffect(() => {
    setAuthHandlers({
      getAccessToken: () => sessionRef.current?.access_token ?? null,
      refreshAccessToken: async () => {
        const rt = sessionRef.current?.refresh_token;
        if (!rt) return null;
        try {
          const { session } = await authApi.refresh(rt);
          await setSession(session);
          return session.access_token;
        } catch {
          return null;
        }
      },
      onSignOut: () => {
        void localSignOut();
      },
    });
  }, [localSignOut, setSession]);

  // Restore a saved session on launch.
  useEffect(() => {
    (async () => {
      const stored = await loadSession();
      if (!stored) {
        setStatus('unauthenticated');
        return;
      }
      sessionRef.current = stored;
      try {
        const { profile: me } = await authApi.me();
        setProfile(me);
        setStatus('authenticated');
      } catch {
        await localSignOut();
      }
    })();
  }, [localSignOut]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { profile: p, session } = await authApi.login(email, password);
      await setSession(session);
      setProfile(p);
      setStatus('authenticated');
    },
    [setSession]
  );

  const register = useCallback(
    async (input: { email: string; password: string; name: string; phone?: string }) => {
      const { profile: p, session } = await authApi.register(input);
      await setSession(session);
      setProfile(p);
      setStatus('authenticated');
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort server-side revoke
    }
    await localSignOut();
  }, [localSignOut]);

  const refetchProfile = useCallback(async () => {
    try {
      const { profile: me } = await authApi.me();
      setProfile(me);
    } catch {
      // ignore; a hard 401 is handled by the client
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, profile, viewMode, setViewMode, login, register, logout, refetchProfile }),
    [status, profile, viewMode, login, register, logout, refetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
