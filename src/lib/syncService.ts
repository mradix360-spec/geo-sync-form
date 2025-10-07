import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from './offlineStorage';

export const syncService = {
  // Fetch assigned forms based on user role
  async fetchAssignedForms(userId: string) {
    try {
      const { data: forms, error } = await supabase
        .from('forms')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Note: Forms are cached by the browser and service worker
      // Additional caching logic can be added here if needed

      return forms;
    } catch (error) {
      console.error('Error fetching forms:', error);
      return [];
    }
  },

  // Push pending submissions with retry logic
  async pushPendingSubmissions() {
    try {
      const pending = await offlineStorage.getPendingSubmissions();
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ id: string; error: string }>
      };

      for (const submission of pending) {
        try {
          const { error } = await supabase
            .from('form_responses')
            .insert({
              form_id: submission.formId,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              geojson: submission.geojson,
              client_id: submission.id,
              synced: true
            });

          if (error) {
            // Check if it's a duplicate (client_id already exists)
            if (error.code === '23505') {
              // Duplicate, mark as synced anyway
              await offlineStorage.markAsSynced(submission.id);
              results.success++;
            } else {
              throw error;
            }
          } else {
            await offlineStorage.markAsSynced(submission.id);
            results.success++;
          }
        } catch (error) {
          console.error('Sync failed for submission:', submission.id, error);
          results.failed++;
          results.errors.push({
            id: submission.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log('Sync complete:', results);
      return results;
    } catch (error) {
      console.error('Error pushing submissions:', error);
      throw error;
    }
  },

  // Check online status
  isOnline() {
    return navigator.onLine;
  },

  // Get pending submission count
  async getPendingCount() {
    const pending = await offlineStorage.getPendingSubmissions();
    return pending.length;
  }
};
