import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, setSupabaseAuth } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
  roles: string[];
  organisation_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phoneNumber: string, orgName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify session on mount and set up periodic refresh
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

      if (!token || !expiry) {
        setSupabaseAuth(null);
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (new Date(expiry) < new Date()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        setSupabaseAuth(null);
        setLoading(false);
        return;
      }

      // Set the custom JWT in Supabase client
      setSupabaseAuth(token);

      // Verify token with backend
      try {
        const { data, error } = await supabase.functions.invoke('auth-verify-session', {
          body: { token }
        });

        if (error || !data.valid) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_EXPIRY_KEY);
          setSupabaseAuth(null);
          setUser(null);
        } else {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Session verification error:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        setSupabaseAuth(null);
        setUser(null);
      }

      setLoading(false);
    };

    verifySession();

    // Set up token refresh interval (every 6 hours)
    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        const { data, error } = await supabase.functions.invoke('auth-refresh-token', {
          body: { token }
        });

        if (!error && data.success) {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(TOKEN_EXPIRY_KEY, data.expiresAt);
          setSupabaseAuth(data.token);
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    return () => clearInterval(refreshInterval);
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

      // Store token and expiry
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, data.expiresAt);
      setSupabaseAuth(data.token);
      
      setUser(data.user);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${email}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, phoneNumber: string, orgName?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-register', {
        body: { email, password, fullName, phoneNumber, orgName }
      });

      if (error || !data?.success) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data?.error || "Failed to create account",
        });
        throw new Error(data?.error || 'Registration failed');
      }

      // Store token and expiry (auto-login after registration)
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, data.expiresAt);
      setSupabaseAuth(data.token);
      
      setUser(data.user);
      
      toast({
        title: "Account created!",
        description: data.user.organisation_id ? "Welcome to GeoSync Forms" : "Your organization request has been submitted",
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      try {
        await supabase.functions.invoke('auth-logout', {
          body: { token }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setSupabaseAuth(null);
    setUser(null);
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
