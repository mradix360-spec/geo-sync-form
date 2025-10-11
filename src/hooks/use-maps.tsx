import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Map {
  id: string;
  title: string;
  description: string;
  config: any;
  thumbnail_url: string | null;
  created_at: string;
  created_by: string | null;
  organisation_id: string | null;
}

export const useMaps = () => {
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setMaps([]);
        setLoading(false);
        return;
      }

      // Get user's groups
      const { data: userGroups } = await supabase
        .from('form_group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      const groupIds = userGroups?.map(g => g.group_id) || [];

      // Get all maps
      const { data: allMaps, error: mapsError } = await supabase
        .from('maps')
        .select('*')
        .order('created_at', { ascending: false });

      if (mapsError) throw mapsError;

      // Get shares for these maps
      const mapIds = allMaps?.map(m => m.id) || [];
      const { data: shares } = await supabase
        .from('shares')
        .select('*')
        .eq('object_type', 'map')
        .in('object_id', mapIds);

      // Filter maps based on visibility rules
      const visibleMaps = allMaps?.filter(map => {
        // 1. User created it
        if (map.created_by === user.id) return true;

        const mapShares = shares?.filter(s => s.object_id === map.id) || [];

        // 2. Map is shared with user's organization from another organization
        if (mapShares.some(s => s.shared_with_organisation === user.organisation_id)) return true;

        // 3. Map is in user's organization
        if (map.organisation_id === user.organisation_id) {
          // If no shares, org can see it
          if (mapShares.length === 0) return true;

          // Check for organization share
          if (mapShares.some(s => s.access_type === 'organisation')) return true;

          // Check for group share
          if (mapShares.some(s => s.group_id && groupIds.includes(s.group_id))) return true;

          // Check for public access
          if (mapShares.some(s => s.access_type === 'public')) return true;

          // Check for direct user share
          if (mapShares.some(s => s.shared_with_user === user.id)) return true;
        }

        return false;
      }) || [];

      setMaps(visibleMaps);
    } catch (error: any) {
      console.error('Error loading maps:', error);
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Error loading maps',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaps();
  }, [user?.id]);

  return { maps, loading, error, refetch: loadMaps };
};
