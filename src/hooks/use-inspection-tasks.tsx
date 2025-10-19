import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InspectionTask } from '@/types/tracking';

export const useInspectionTasks = (filterByAssigned: boolean = false) => {
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTasks = async () => {
    if (!user?.organisation_id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from('inspection_tasks')
        .select(`
          *,
          asset:assets(*),
          form:forms(*),
          assignments:task_assignments(*)
        `)
        .eq('organisation_id', user.organisation_id);

      if (filterByAssigned) {
        // Get tasks assigned to this user or their groups
        const { data: assignments } = await supabase
          .from('task_assignments')
          .select('task_id')
          .or(`user_id.eq.${user.id},group_id.in.(${
            await getGroupIds(user.id)
          })`);

        const taskIds = assignments?.map(a => a.task_id) || [];
        if (taskIds.length === 0) {
          setTasks([]);
          setLoading(false);
          return;
        }

        query = query.in('id', taskIds);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setTasks(data as any || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading inspection tasks',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inspection_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Task deleted',
        description: 'The inspection task has been removed successfully.',
      });

      await loadTasks();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting task',
        description: error.message,
      });
    }
  };

  const updateTaskStatus = async (id: string, status: any) => {
    try {
      const { error } = await supabase
        .from('inspection_tasks')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      await loadTasks();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating task',
        description: error.message,
      });
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.organisation_id, filterByAssigned]);

  return { tasks, loading, refetch: loadTasks, deleteTask, updateTaskStatus };
};

async function getGroupIds(userId: string): Promise<string> {
  const { data } = await supabase
    .from('form_group_members')
    .select('group_id')
    .eq('user_id', userId);
  
  return data?.map(g => g.group_id).join(',') || '';
}
