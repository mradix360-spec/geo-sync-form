import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.organisation_id) {
        setForms([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_forms_by_share_type', {
        share_filter: shareFilter,
      });

      if (error) throw error;

      // Filter to only show forms from user's organization
      const orgForms = (data || []).filter(
        (form: Form) => form.organisation_id === user.organisation_id
      );

      setForms(orgForms);
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
  }, [shareFilter, user?.organisation_id]);

  return { forms, loading, error, refetch: loadForms };
};
