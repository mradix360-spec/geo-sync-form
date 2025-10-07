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
    <div className="p-4 space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Offline Manager</h2>
            <p className="text-sm text-muted-foreground">Manage your cached data & sync</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <Alert className={`border-0 shadow-[var(--shadow-card)] ${isOnline ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" : "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"} animate-slide-up`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOnline ? "bg-gradient-to-br from-green-500 to-emerald-500" : "bg-gradient-to-br from-orange-500 to-amber-500"} shadow-lg`}>
            {isOnline ? <Wifi className="h-5 w-5 text-white" /> : <WifiOff className="h-5 w-5 text-white" />}
          </div>
          <AlertDescription className={`font-medium ${isOnline ? "text-green-800 dark:text-green-200" : "text-orange-800 dark:text-orange-200"}`}>
            {isOnline ? "Connected to the internet" : "Working offline - submissions will sync when online"}
          </AlertDescription>
        </div>
      </Alert>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <Card className="border-0 shadow-[var(--shadow-card)] bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground">{totalPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Waiting to sync</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[var(--shadow-card)] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Cached</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Database className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground">{totalCached}</div>
            <p className="text-xs text-muted-foreground mt-1">Available offline</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[var(--shadow-card)] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Storage</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <HardDrive className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-foreground">{(totalPending + totalCached)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total items</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Button */}
      {totalPending > 0 && (
        <Card className="border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Sync Data
            </CardTitle>
            <CardDescription>Upload {totalPending} pending submission{totalPending !== 1 ? 's' : ''} to the server</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSync} 
              disabled={!isOnline || syncing}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-[var(--shadow-glow)] transition-all duration-300 font-semibold"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Sync Now
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
