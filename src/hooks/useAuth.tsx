import { useState, useEffect, useRef, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'super_admin' | 'franchise_admin' | 'driver' | 'passenger' | 'merchant';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  profile: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
  isSuperAdmin: boolean;
  isFranchiseAdmin: boolean;
  isDriver: boolean;
  isPassenger: boolean;
  isMerchant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const { toast } = useToast();
  const currentUserIdRef = useRef<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      
      console.log('[Auth] Fetched roles:', rolesResult.data, 'error:', rolesResult.error);
      console.log('[Auth] Fetched profile:', profileResult.data ? 'found' : 'not found', 'error:', profileResult.error);
      
      if (rolesResult.data) {
        setRoles(rolesResult.data.map(r => r.role as AppRole));
      } else {
        setRoles([]);
      }
      if (profileResult.data) {
        setProfile(profileResult.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('[Auth] Error fetching user data:', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid = currentUserIdRef.current;
    if (uid) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        console.log('[Auth] onAuthStateChange:', event, newSession?.user?.id);

        const newUserId = newSession?.user?.id ?? null;
        
        // Always update session/user immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Only refetch data if user actually changed
        if (newUserId !== currentUserIdRef.current) {
          currentUserIdRef.current = newUserId;
          
          if (newUserId) {
            // Use setTimeout to avoid Supabase auth deadlock
            // (onAuthStateChange callback should not make async Supabase calls directly)
            setTimeout(async () => {
              if (!mounted) return;
              await fetchUserData(newUserId);
              if (mounted) setLoading(false);
            }, 0);
          } else {
            setRoles([]);
            setProfile(null);
            setLoading(false);
          }
        } else {
          // Same user, just token refresh - don't change loading
          setLoading(false);
        }
      }
    );

    // 2. Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      
      console.log('[Auth] Initial session:', initialSession?.user?.id);
      
      const userId = initialSession?.user?.id ?? null;
      
      // Only process if we haven't been updated by onAuthStateChange yet
      if (currentUserIdRef.current === null && userId !== null) {
        currentUserIdRef.current = userId;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        await fetchUserData(userId);
      } else if (userId === null) {
        currentUserIdRef.current = null;
      }
      
      if (mounted) setLoading(false);
    }).catch((err) => {
      console.error('[Auth] Error getting session:', err);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  }, [toast]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setProfile(null);
    currentUserIdRef.current = null;
  }, []);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    roles,
    profile,
    signIn,
    signUp,
    signOut,
    hasRole,
    refreshProfile,
    isSuperAdmin: roles.includes('super_admin'),
    isFranchiseAdmin: roles.includes('franchise_admin'),
    isDriver: roles.includes('driver'),
    isPassenger: roles.includes('passenger'),
    isMerchant: roles.includes('merchant'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
