import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
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
  const initializedRef = useRef(false);

  const fetchUserData = async (userId: string) => {
    try {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      
      if (rolesResult.data) {
        setRoles(rolesResult.data.map(r => r.role as AppRole));
      }
      if (profileResult.data) {
        setProfile(profileResult.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        const newUserId = newSession?.user?.id ?? null;
        const previousUserId = currentUserIdRef.current;

        // Update session and user immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Only fetch user data if user actually changed (not on token refreshes)
        if (newUserId !== previousUserId) {
          currentUserIdRef.current = newUserId;
          
          if (newUserId) {
            // Set loading only on actual user change to prevent redirect loops
            if (initializedRef.current) {
              setLoading(true);
            }
            await fetchUserData(newUserId);
          } else {
            setRoles([]);
            setProfile(null);
          }
        }

        // Always mark as no longer loading after processing
        setLoading(false);
        initializedRef.current = true;
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      // Only process if onAuthStateChange hasn't already handled it
      if (!initializedRef.current) {
        const userId = initialSession?.user?.id ?? null;
        currentUserIdRef.current = userId;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (userId) {
          await fetchUserData(userId);
        }
        setLoading(false);
        initializedRef.current = true;
      }
    }).catch((err) => {
      console.error('Error getting session:', err);
      setLoading(false);
      initializedRef.current = true;
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setProfile(null);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

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
    isSuperAdmin: hasRole('super_admin'),
    isFranchiseAdmin: hasRole('franchise_admin'),
    isDriver: hasRole('driver'),
    isPassenger: hasRole('passenger'),
    isMerchant: hasRole('merchant'),
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
