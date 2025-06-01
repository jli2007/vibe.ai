"use client";

import { PropsWithChildren, useState, useEffect } from "react";
import { supabaseClient } from "@/integrations/supabase/supabaseClient";
import { AuthUser } from "@supabase/supabase-js";
import { AuthContext } from "./AuthContext";

const signOut = supabaseClient.auth.signOut.bind(supabaseClient.auth);
const signInWithOAuth = supabaseClient.auth.signInWithOAuth.bind(
  supabaseClient.auth
);

export interface AuthProviderValue {
  supabase: typeof supabaseClient;
  signOut: typeof signOut;
  signInWithOAuth: typeof signInWithOAuth;
  user: AuthUser | null;
}

export default function AuthProvider({ children }: PropsWithChildren<{}>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateUser = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      setUser(session?.user || null);
      setLoading(false);

      supabaseClient.auth.onAuthStateChange(
        async (_event: any, session: any) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );
    };
    updateUser();
  }, []);

  const value: AuthProviderValue = {
    supabase: supabaseClient,
    signOut,
    signInWithOAuth,
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* renders children components when the loading is complete */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
