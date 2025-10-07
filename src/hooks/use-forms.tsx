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
  response_count?: number;
}

export const useForms = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_responses(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formsWithCount = data?.map(form => ({
        ...form,
        response_count: form.form_responses?.[0]?.count || 0,
      })) || [];

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
  }, []);

  return { forms, loading, error, refetch: loadForms };
};
