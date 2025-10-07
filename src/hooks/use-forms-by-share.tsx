import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Form {
  id: string;
  title: string;
  description: string;
  geometry_type: string;
  is_published: boolean;
  status: string;
  created_at: string;
  created_by: string;
  organisation_id: string;
  share_type: string;
  response_count: number;
}

export const useFormsByShare = (shareFilter: string | null = null) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_forms_by_share_type', {
        share_filter: shareFilter,
      });

      if (error) throw error;

      setForms(data || []);
    } catch (error: any) {
      console.error('Error loading forms:', error);
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Error loading forms',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [shareFilter]);

  return { forms, loading, error, refetch: loadForms };
};
