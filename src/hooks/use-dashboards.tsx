import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const loadDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboards(data || []);
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
  }, []);

  return { dashboards, loading, error, refetch: loadDashboards };
};
