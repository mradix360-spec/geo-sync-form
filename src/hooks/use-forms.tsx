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
  created_by: string | null;
  response_count?: number;
}

export const useForms = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setForms([]);
        setLoading(false);
        return;
      }

      // Check if user is field staff
      const isFieldStaff = user.roles?.includes('field_staff');

      // If field staff, only get assigned forms
      if (isFieldStaff) {
        const { data: assignments } = await supabase
          .from('form_assignments')
          .select('form_id')
          .eq('user_id', user.id);
        
        const assignedFormIds = assignments?.map(a => a.form_id) || [];

        if (assignedFormIds.length === 0) {
          setForms([]);
          setLoading(false);
          return;
        }

        // Get only assigned forms from user's organization
        const { data: assignedForms, error: formsError } = await supabase
          .from('forms')
          .select(`
            *,
            form_responses(count)
          `)
          .in('id', assignedFormIds)
          .eq('organisation_id', user.organisation_id)
          .order('created_at', { ascending: false });

        if (formsError) throw formsError;

        const formsWithCount = assignedForms?.map(form => ({
          ...form,
          response_count: form.form_responses?.[0]?.count || 0,
        })) || [];

        setForms(formsWithCount);
        setLoading(false);
        return;
      }

      // For non-field staff, get forms from their organization only
      const { data: allForms, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          form_responses(count)
        `)
        .eq('organisation_id', user.organisation_id)
        .order('created_at', { ascending: false });

      if (formsError) throw formsError;

      const visibleForms = allForms || [];

      const formsWithCount = visibleForms.map(form => ({
        ...form,
        response_count: form.form_responses?.[0]?.count || 0,
      }));

      setForms(formsWithCount);
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
  }, [user?.id]);

  return { forms, loading, error, refetch: loadForms };
};
