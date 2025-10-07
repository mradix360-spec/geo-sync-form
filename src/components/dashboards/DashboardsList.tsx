import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, Share2, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SharePermissionDialog } from "../forms/SharePermissionDialog";
import { useDashboards } from "@/hooks/use-dashboards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DashboardsListProps {
  showHeader?: boolean;
}

export const DashboardsList = ({ showHeader = true }: DashboardsListProps) => {
  const navigate = useNavigate();
  const { dashboards, loading, refetch } = useDashboards();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareDashboardId, setShareDashboardId] = useState<string | null>(null);
  const [deleteDashboardId, setDeleteDashboardId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteDashboardId) return;

    try {
      setDeleting(true);

      await supabase.from("shares").delete().eq("object_id", deleteDashboardId);

      const { error } = await supabase
        .from("dashboards")
        .delete()
        .eq("id", deleteDashboardId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Dashboard deleted successfully",
      });

      refetch();
      setDeleteDashboardId(null);
    } catch (error: any) {
      console.error("Error deleting dashboard:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete dashboard",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (dashboards.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No dashboards yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first dashboard to visualize your data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">My Dashboards</h2>
          <p className="text-muted-foreground">
            View and manage your dashboards
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => (
          <Card
            key={dashboard.id}
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate(`/dashboard-builder/${dashboard.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{dashboard.title}</CardTitle>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription className="line-clamp-2">
                {dashboard.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(dashboard.created_at).toLocaleDateString()}</span>
              </div>
              {dashboard.is_public && (
                <Badge variant="secondary">Public</Badge>
              )}
            </CardContent>
            <CardFooter className="gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dashboard-builder/${dashboard.id}`);
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShareDashboardId(dashboard.id);
                  setShowShareDialog(true);
                }}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDashboardId(dashboard.id);
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {showShareDialog && shareDashboardId && (
        <SharePermissionDialog
          formId={shareDashboardId}
          objectType="dashboard"
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <AlertDialog open={!!deleteDashboardId} onOpenChange={() => setDeleteDashboardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dashboard? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
