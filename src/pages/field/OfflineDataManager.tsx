import { useEffect, useState } from "react";
import { offlineStorage, PendingSubmission } from "@/lib/offlineStorage";
import { syncService } from "@/lib/syncService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Upload, Trash2, HardDrive, Wifi, WifiOff, CheckCircle2, Clock, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OfflineDataManager = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [cachedForms, setCachedForms] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOfflineData();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = async () => {
    try {
      setLoading(true);
      const [submissions, forms] = await Promise.all([
        offlineStorage.getPendingSubmissions(),
        offlineStorage.getCachedForms()
      ]);
      setPendingSubmissions(submissions);
      setCachedForms(forms);
    } catch (error) {
      console.error("Error loading offline data:", error);
      toast({
        variant: "destructive",
        title: "Error loading offline data",
        description: "Could not load offline data from storage"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "No internet connection",
        description: "Please connect to the internet to sync"
      });
      return;
    }

    try {
      setSyncing(true);
      const result = await syncService.pushPendingSubmissions();
      
      if (result.success > 0) {
        toast({
          title: "Sync successful",
          description: `${result.success} submission(s) synced successfully`
        });
      }
      
      if (result.failed > 0) {
        toast({
          variant: "destructive",
          title: "Sync partially failed",
          description: `${result.failed} submission(s) failed to sync`
        });
      }
      
      await loadOfflineData();
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not sync submissions"
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      await offlineStorage.markAsSynced(id);
      toast({
        title: "Submission deleted",
        description: "Pending submission removed from offline storage"
      });
      await loadOfflineData();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete submission"
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStorageSize = () => {
    const totalPending = pendingSubmissions.length;
    const totalCached = cachedForms.length;
    return { totalPending, totalCached };
  };

  const { totalPending, totalCached } = getStorageSize();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Offline Data Manager</h2>
        <p className="text-muted-foreground">Manage your cached forms and pending submissions</p>
      </div>

      {/* Connection Status */}
      <Alert className={isOnline ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-orange-500 bg-orange-50 dark:bg-orange-950"}>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-orange-600" />}
          <AlertDescription className={isOnline ? "text-green-800 dark:text-green-200" : "text-orange-800 dark:text-orange-200"}>
            {isOnline ? "Connected to the internet" : "Working offline - submissions will sync when online"}
          </AlertDescription>
        </div>
      </Alert>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Waiting to sync</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cached Forms</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCached}</div>
            <p className="text-xs text-muted-foreground">Available offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalPending + totalCached)}</div>
            <p className="text-xs text-muted-foreground">Total items stored</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Button */}
      {totalPending > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Data</CardTitle>
            <CardDescription>Upload pending submissions to the server</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSync} 
              disabled={!isOnline || syncing}
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Sync {totalPending} Submission{totalPending !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Submissions
          </CardTitle>
          <CardDescription>
            {totalPending === 0 
              ? "All submissions are synced" 
              : `${totalPending} submission${totalPending !== 1 ? 's' : ''} waiting to sync`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p>No pending submissions</p>
            </div>
          ) : (
            pendingSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Form ID: {submission.formId.slice(0, 8)}...</p>
                  <p className="text-sm text-muted-foreground">{formatDate(submission.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteSubmission(submission.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Cached Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Cached Forms
          </CardTitle>
          <CardDescription>Forms available for offline use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cachedForms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No forms cached yet</p>
            </div>
          ) : (
            cachedForms.map((form) => (
              <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{form.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Cached: {formatDate(form.cachedAt)}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Available
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineDataManager;
