import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { cloud } from "@/lib/cloudClient";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Keep callback sync to avoid auth deadlocks.
    const { data } = cloud.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    cloud.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
      })
      .finally(() => setLoading(false));

    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = React.useCallback(async () => {
    await cloud.auth.signOut();
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ session, user, loading, signOut }),
    [session, user, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
