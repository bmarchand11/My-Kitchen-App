import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

export type Household = Database['public']['Tables']['households']['Row'];
export type Member = Database['public']['Tables']['household_members']['Row'];

type SessionContextValue = {
  // False until the saved sign-in (and household, if signed in) has been checked.
  ready: boolean;
  session: Session | null;
  household: Household | null;
  members: Member[];
  myName: string;
  signIn: (email: string, password: string) => Promise<void>;
  // Resolves to true when Supabase wants the email confirmed before signing in.
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  createHousehold: (name: string, myName: string) => Promise<void>;
  joinHousehold: (code: string, myName: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [householdChecked, setHouseholdChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const loadHousehold = useCallback(async () => {
    if (!userId) {
      setHousehold(null);
      setMembers([]);
      setHouseholdChecked(true);
      return;
    }
    const { data: mine, error } = await supabase
      .from('household_members')
      .select('household_id, households(*)')
      .eq('user_id', userId)
      .order('joined_at')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const found = mine?.households ?? null;
    setHousehold(found);
    if (found) {
      const { data: all, error: membersError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', found.id)
        .order('joined_at');
      if (membersError) throw membersError;
      setMembers(all ?? []);
    } else {
      setMembers([]);
    }
    setHouseholdChecked(true);
  }, [userId]);

  useEffect(() => {
    setHouseholdChecked(false);
    loadHousehold().catch(() => setHouseholdChecked(true));
  }, [loadHousehold]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ready: authChecked && householdChecked,
      session,
      household,
      members,
      myName: members.find((m) => m.user_id === userId)?.display_name ?? '',
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        return !data.session;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      createHousehold: async (name, myName) => {
        const { error } = await supabase.rpc('create_household', { household_name: name, member_name: myName });
        if (error) throw error;
        await loadHousehold();
      },
      joinHousehold: async (code, myName) => {
        const { error } = await supabase.rpc('join_household', { code, member_name: myName });
        if (error) throw error;
        await loadHousehold();
      },
      leaveHousehold: async () => {
        if (!household || !userId) return;
        const { error } = await supabase
          .from('household_members')
          .delete()
          .eq('household_id', household.id)
          .eq('user_id', userId);
        if (error) throw error;
        await loadHousehold();
      },
    }),
    [authChecked, householdChecked, session, household, members, userId, loadHousehold],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
