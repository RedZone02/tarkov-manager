'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSameAuthUser, toAuthUser, type AuthUser } from './user';

type AuthContextValue = {
  enabled: boolean;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue>({ enabled: false, user: null });

type AuthProviderProps = {
  enabled: boolean;
  initialUser: AuthUser | null;
  children: ReactNode;
};

export function AuthProvider({ enabled, initialUser, children }: AuthProviderProps) {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (!enabled) return;
    const { data } = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
      const next = session ? toAuthUser(session.user) : null;
      setUser((current) => (isSameAuthUser(current, next) ? current : next));
    });
    return () => data.subscription.unsubscribe();
  }, [enabled]);

  const value = useMemo(() => ({ enabled, user: enabled ? user : null }), [enabled, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
