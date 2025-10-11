import { useState, useEffect } from 'react';
import { syncService } from '@/lib/syncService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await syncService.getPendingCount();
    setPendingCount(count);
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'You must be online to sync',
        variant: 'destructive'
      });
      return;
    }

    setSyncing(true);
    try {
      const results = await syncService.pushPendingSubmissions();
      
      if (results.success > 0) {
        toast({
          title: 'Sync Complete',
          description: `Successfully synced ${results.success} submission(s)`,
        });
        
        // Trigger stats refresh event
        window.dispatchEvent(new CustomEvent('stats-refresh'));
      }
      
      if (results.failed > 0) {
        toast({
          title: 'Partial Sync',
          description: `${results.failed} submission(s) failed to sync`,
          variant: 'destructive'
        });
      }

      await updatePendingCount();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync submissions',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>

      {pendingCount > 0 && (
        <>
          <Badge variant="secondary">
            {pendingCount} pending
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={!isOnline || syncing}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1">Sync</span>
          </Button>
        </>
      )}
    </div>
  );
};
