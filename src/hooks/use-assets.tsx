import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Asset } from '@/types/tracking';

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadAssets = async () => {
    if (!user?.organisation_id) {
      setAssets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('organisation_id', user.organisation_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssets(data as any || []);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading assets',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Asset deleted',
        description: 'The asset has been removed successfully.',
      });

      await loadAssets();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting asset',
        description: error.message,
      });
    }
  };

  useEffect(() => {
    loadAssets();
  }, [user?.organisation_id]);

  return { assets, loading, refetch: loadAssets, deleteAsset };
};
