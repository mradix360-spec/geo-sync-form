import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const loadMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaps(data || []);
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
  }, []);

  return { maps, loading, error, refetch: loadMaps };
};
