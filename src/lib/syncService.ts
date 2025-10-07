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

      // Cache forms for offline use
      if (forms) {
        for (const form of forms) {
          await offlineStorage.cacheForm(form);
        }
      }

      return forms;
    } catch (error) {
      console.error('Error fetching forms:', error);
      // Return cached forms if offline
      if (!navigator.onLine) {
        return await offlineStorage.getCachedForms();
      }
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
  },

  // Auto-sync when coming back online
  async startAutoSync() {
    window.addEventListener('online', async () => {
      console.log('Connection restored, auto-syncing...');
      try {
        const results = await this.pushPendingSubmissions();
        if (results.success > 0) {
          console.log(`Auto-synced ${results.success} submission(s)`);
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    });
  },

  // Prefetch form for offline use
  async prefetchForm(formId: string) {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) throw error;
      if (data) {
        await offlineStorage.cacheForm(data);
      }
      return data;
    } catch (error) {
      console.error('Error prefetching form:', error);
      // Try to get from cache
      return await offlineStorage.getCachedForm(formId);
    }
  }
};
