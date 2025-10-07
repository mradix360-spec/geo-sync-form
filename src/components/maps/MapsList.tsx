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
import { Map, Calendar, Share2, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SharePermissionDialog } from "../forms/SharePermissionDialog";
import { useMaps } from "@/hooks/use-maps";
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

interface MapsListProps {
  showHeader?: boolean;
}

export const MapsList = ({ showHeader = true }: MapsListProps) => {
  const navigate = useNavigate();
  const { maps, loading, refetch } = useMaps();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMapId, setShareMapId] = useState<string | null>(null);
  const [deleteMapId, setDeleteMapId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteMapId) return;

    try {
      setDeleting(true);

      // Delete associated shares first
      await supabase.from("shares").delete().eq("object_id", deleteMapId);

      // Delete the map
      const { error } = await supabase
        .from("maps")
        .delete()
        .eq("id", deleteMapId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Map deleted successfully",
      });

      refetch();
      setDeleteMapId(null);
    } catch (error: any) {
      console.error("Error deleting map:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete map",
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

  if (maps.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Map className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No maps yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first map to visualize form data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">My Maps</h2>
          <p className="text-muted-foreground">
            View and manage your map configurations
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {maps.map((map) => (
          <Card
            key={map.id}
            className="hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate(`/map-builder/${map.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{map.title}</CardTitle>
                <Map className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription className="line-clamp-2">
                {map.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(map.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
            <CardFooter className="gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/map-builder/${map.id}`);
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
                  setShareMapId(map.id);
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
                  setDeleteMapId(map.id);
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {showShareDialog && shareMapId && (
        <SharePermissionDialog
          formId={shareMapId}
          objectType="map"
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <AlertDialog open={!!deleteMapId} onOpenChange={() => setDeleteMapId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Map</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this map? This action cannot be
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
