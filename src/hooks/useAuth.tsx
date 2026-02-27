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
  signUp: (email: string, password: string, fullName: string, metadata?: { user_type?: string; city_id?: string; phone?: string }) => Promise<{ error: any }>;
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

      // Get user metadata for auto-provisioning
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userMeta = authUser?.user_metadata;

      // Auto-create profile if missing
      if (!profileResult.data && authUser) {
        console.log('[Auth] Auto-creating profile for new user');
        const { data: newProfile } = await supabase.from('profiles').insert({
          user_id: userId,
          full_name: userMeta?.full_name || authUser.email || '',
          email: authUser.email || '',
          phone: userMeta?.phone || null,
        }).select().maybeSingle();
        
        if (newProfile) {
          setProfile(newProfile);
        }
      } else if (profileResult.data) {
        setProfile(profileResult.data);
      } else {
        setProfile(null);
      }

      // Auto-create role and entity record if missing
      if (rolesResult.data && rolesResult.data.length > 0) {
        setRoles(rolesResult.data.map(r => r.role as AppRole));
      } else if (userMeta?.user_type) {
        console.log('[Auth] Auto-creating role:', userMeta.user_type);
        const roleMap: Record<string, AppRole> = {
          passenger: 'passenger',
          driver: 'driver',
          merchant: 'merchant',
        };
        const role = roleMap[userMeta.user_type];
        if (role) {
          await supabase.from('user_roles').insert({ user_id: userId, role }).select();
          setRoles([role]);

          // Auto-create entity record linked to franchise/city
          await autoCreateEntityRecord(userId, userMeta.user_type, userMeta.city_id);
        }
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('[Auth] Error fetching user data:', error);
    }
  }, []);

  const autoCreateEntityRecord = useCallback(async (userId: string, userType: string, cityId?: string) => {
    try {
      // Find franchise for this city (or first active franchise)
      let franchiseId: string | null = null;
      
      if (cityId) {
        const { data: franchise } = await supabase
          .from('franchises')
          .select('id')
          .eq('city_id', cityId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        franchiseId = franchise?.id || null;
      }
      
      if (!franchiseId) {
        // CRITICO: NUNCA fazer fallback para qualquer franquia ativa!
        // Isso causava usuarios de Guaxupé serem vinculados a Jundiaí
        console.error('[Auth] ERRO CRITICO: Nenhuma franquia encontrada para city_id:', cityId, 
          '- NÃO será criado registro de entidade para evitar vinculação incorreta.');
        return;
      }

      if (userType === 'passenger') {
        await supabase.from('passengers').insert({
          user_id: userId,
          franchise_id: franchiseId,
        }).select();
      } else if (userType === 'driver') {
        await supabase.from('drivers').insert({
          user_id: userId,
          franchise_id: franchiseId,
          is_approved: false,
        }).select();
      } else if (userType === 'merchant') {
        await supabase.from('merchants').insert({
          user_id: userId,
          franchise_id: franchiseId,
          is_approved: false,
          business_name: 'Meu Negócio',
          business_address: '',
        } as any).select();
      }
      
      console.log('[Auth] Auto-created', userType, 'record for franchise', franchiseId);
    } catch (error) {
      console.error('[Auth] Error auto-creating entity record:', error);
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

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    fullName: string,
    metadata?: { user_type?: string; city_id?: string; phone?: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: fullName,
          ...(metadata?.user_type && { user_type: metadata.user_type }),
          ...(metadata?.city_id && { city_id: metadata.city_id }),
          ...(metadata?.phone && { phone: metadata.phone }),
        } 
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
