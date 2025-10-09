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

        // Get only assigned forms
        const { data: assignedForms, error: formsError } = await supabase
          .from('forms')
          .select(`
            *,
            form_responses(count)
          `)
          .in('id', assignedFormIds)
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

      // For non-field staff, get all accessible forms
      // Get user's groups
      const { data: userGroups } = await supabase
        .from('form_group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      const groupIds = userGroups?.map(g => g.group_id) || [];

      // Get all forms with response count
      const { data: allForms, error: formsError } = await supabase
        .from('forms')
        .select(`
          *,
          form_responses(count)
        `)
        .order('created_at', { ascending: false });

      if (formsError) throw formsError;

      // Get shares for these forms
      const formIds = allForms?.map(f => f.id) || [];
      const { data: shares } = await supabase
        .from('shares')
        .select('*')
        .eq('object_type', 'form')
        .in('object_id', formIds);

      // Filter forms based on visibility rules
      const visibleForms = allForms?.filter(form => {
        // 1. User created it
        if (form.created_by === user.id) return true;

        // 2. Form is in user's organization
        if (form.organisation_id === user.organisation_id) {
          // Check if there's a share for this
          const formShares = shares?.filter(s => s.object_id === form.id) || [];
          
          // If no shares, org can see it
          if (formShares.length === 0) return true;

          // Check for organization share
          if (formShares.some(s => s.shared_with_organisation === user.organisation_id)) return true;

          // Check for group share
          if (formShares.some(s => s.group_id && groupIds.includes(s.group_id))) return true;

          // Check for public access
          if (formShares.some(s => s.access_type === 'public')) return true;

          // Check for direct user share
          if (formShares.some(s => s.shared_with_user === user.id)) return true;
        }

        return false;
      }) || [];

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
