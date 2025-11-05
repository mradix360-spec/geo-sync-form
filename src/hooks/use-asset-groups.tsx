import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AssetGroup } from '@/types/tracking';

export const useAssetGroups = () => {
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadAssetGroups = useCallback(async () => {
    if (!user?.organisation_id) {
      setAssetGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('asset_groups')
        .select('*')
        .eq('organisation_id', user.organisation_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssetGroups(data as any || []);
    } catch (error: any) {
      console.error('Error loading asset groups:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading asset groups',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.organisation_id]);

  const createAssetGroup = async (group: Partial<AssetGroup>) => {
    if (!user?.organisation_id) return;

    try {
      const { error } = await supabase.from('asset_groups').insert({
        organisation_id: user.organisation_id,
        name: group.name,
        description: group.description,
        asset_ids: group.asset_ids || [],
        created_by: user.id,
      } as any);

      if (error) throw error;

      toast({
        title: 'Asset group created',
        description: 'The asset group has been created successfully.',
      });

      await loadAssetGroups();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating asset group',
        description: error.message,
      });
      throw error;
    }
  };

  const updateAssetGroup = async (id: string, updates: Partial<AssetGroup>) => {
    try {
      const { error } = await supabase
        .from('asset_groups')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Asset group updated',
        description: 'The asset group has been updated successfully.',
      });

      await loadAssetGroups();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating asset group',
        description: error.message,
      });
      throw error;
    }
  };

  const deleteAssetGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('asset_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Asset group deleted',
        description: 'The asset group has been removed successfully.',
      });

      await loadAssetGroups();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting asset group',
        description: error.message,
      });
    }
  };

  useEffect(() => {
    loadAssetGroups();
  }, [loadAssetGroups]);

  return { assetGroups, loading, refetch: loadAssetGroups, createAssetGroup, updateAssetGroup, deleteAssetGroup };
};
