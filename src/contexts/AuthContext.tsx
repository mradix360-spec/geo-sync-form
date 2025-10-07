import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  organisation_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // For MVP, we'll use a mock JWT system
      // In production, this would call your custom auth API
      const mockToken = btoa(JSON.stringify({ email, exp: Date.now() + 86400000 }));
      
      // Query the users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !userData) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email or password",
        });
        throw new Error('Invalid credentials');
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        organisation_id: userData.organisation_id,
      };

      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setToken(mockToken);
      setUser(user);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.email}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, orgName?: string) => {
    try {
      let orgId: string | null = null;

      // Create organization if provided
      if (orgName) {
        const { data: orgData, error: orgError } = await supabase
          .from('organisations')
          .insert({ name: orgName, current_users: 1 })
          .select()
          .single();

        if (orgError) throw orgError;
        orgId = orgData.id;
      }

      // Create user (in production, password would be hashed server-side)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: btoa(password), // Mock hash - NEVER do this in production
          full_name: fullName,
          organisation_id: orgId,
          role: orgName ? 'org_admin' : 'field_staff',
        })
        .select()
        .single();

      if (userError) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: userError.message,
        });
        throw userError;
      }

      // Auto-login after registration
      await login(email, password);

      toast({
        title: "Account created!",
        description: "Welcome to GeoSync Forms",
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
