import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  full_name?: string;
  roles: string[];
  organisation_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async (userId: string) => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const { data: userData } = await supabase
      .from('users')
      .select('full_name, organisation_id')
      .eq('id', userId)
      .single();

    return {
      roles: roles?.map(r => r.role) || [],
      full_name: userData?.full_name,
      organisation_id: userData?.organisation_id
    };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer additional Supabase calls with setTimeout to avoid deadlock
          setTimeout(async () => {
            const userDetails = await fetchUserRoles(session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email!,
              roles: userDetails.roles,
              full_name: userDetails.full_name,
              organisation_id: userDetails.organisation_id
            });
          }, 0);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setTimeout(async () => {
          const userDetails = await fetchUserRoles(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email!,
            roles: userDetails.roles,
            full_name: userDetails.full_name,
            organisation_id: userDetails.organisation_id
          });
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { email, password }
      });

      if (error || !data?.success) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: data?.error || "Invalid email or password",
        });
        throw new Error(data?.error || 'Invalid credentials');
      }

      toast({
        title: "Welcome back!",
        description: `Logged in as ${email}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, orgName?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-register', {
        body: { email, password, fullName, orgName }
      });

      if (error || !data?.success) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data?.error || "Failed to create account",
        });
        throw new Error(data?.error || 'Registration failed');
      }

      toast({
        title: "Account created!",
        description: "Welcome to GeoSync Forms",
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
