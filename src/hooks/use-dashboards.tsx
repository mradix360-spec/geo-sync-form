import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Dashboard {
  id: string;
  title: string;
  description: string | null;
  config: any;
  is_public: boolean;
  created_at: string;
  created_by: string | null;
  organisation_id: string | null;
}

export const useDashboards = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setDashboards([]);
        setLoading(false);
        return;
      }

      // Get user's groups
      const { data: userGroups } = await supabase
        .from('form_group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      const groupIds = userGroups?.map(g => g.group_id) || [];

      // Get all dashboards
      const { data: allDashboards, error: dashboardsError } = await supabase
        .from('dashboards')
        .select('*')
        .order('created_at', { ascending: false });

      if (dashboardsError) throw dashboardsError;

      // Get shares for these dashboards
      const dashboardIds = allDashboards?.map(d => d.id) || [];
      const { data: shares } = await supabase
        .from('shares')
        .select('*')
        .eq('object_type', 'dashboard')
        .in('object_id', dashboardIds);

      // Filter dashboards based on visibility rules
      const visibleDashboards = allDashboards?.filter(dashboard => {
        // 1. User created it
        if (dashboard.created_by === user.id) return true;

        // 2. Dashboard is public
        if (dashboard.is_public) return true;

        const dashboardShares = shares?.filter(s => s.object_id === dashboard.id) || [];

        // 3. Dashboard is shared with user's organization from another organization
        if (dashboardShares.some(s => s.shared_with_organisation === user.organisation_id)) return true;

        // 4. Dashboard is in user's organization
        if (dashboard.organisation_id === user.organisation_id) {
          // If no shares, org can see it
          if (dashboardShares.length === 0) return true;

          // Check for organization share
          if (dashboardShares.some(s => s.access_type === 'organisation')) return true;

          // Check for group share
          if (dashboardShares.some(s => s.group_id && groupIds.includes(s.group_id))) return true;

          // Check for public access
          if (dashboardShares.some(s => s.access_type === 'public')) return true;

          // Check for direct user share
          if (dashboardShares.some(s => s.shared_with_user === user.id)) return true;
        }

        return false;
      }) || [];

      setDashboards(visibleDashboards);
    } catch (error: any) {
      console.error('Error loading dashboards:', error);
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Error loading dashboards',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, [user?.id]);

  return { dashboards, loading, error, refetch: loadDashboards };
};
