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

      // Get forms shared with user's organization from other organizations
      const { data: sharedForms } = await supabase
        .from('forms')
        .select(`
          *,
          shares!inner(*)
        `)
        .eq('shares.object_type', 'form')
        .eq('shares.shared_with_organisation', user.organisation_id);

      // Combine forms from user's organization and forms shared with them
      const orgForms = (data || []).filter(
        (form: Form) => form.organisation_id === user.organisation_id
      );

      const combinedForms = [
        ...orgForms,
        ...(sharedForms || []).map((f: any) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          geometry_type: f.geometry_type,
          is_published: f.is_published,
          status: f.status,
          created_at: f.created_at,
          created_by: f.created_by,
          organisation_id: f.organisation_id,
          share_type: 'other_organisation',
          response_count: 0,
        }))
      ];

      // Remove duplicates by id
      const uniqueForms = Array.from(
        new Map(combinedForms.map(form => [form.id, form])).values()
      );

      setForms(uniqueForms);
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
