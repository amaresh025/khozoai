import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  emailVerified: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  emailVerified: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[Auth] Initializing auth state listener (onAuthStateChange)");
    // onAuthStateChange fires INITIAL_SESSION immediately, so a separate
    // getSession() call would cause a redundant state update (visible refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("[Auth] onAuthStateChange event:", event, {
        hasSession: !!s,
        hasUser: !!s?.user,
        userId: s?.user?.id,
      });
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  const emailVerified = !!user?.email_confirmed_at || user?.app_metadata?.provider !== "email";

  const value: AuthContextValue = {
    user,
    session,
    loading,
    emailVerified: !!emailVerified,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
