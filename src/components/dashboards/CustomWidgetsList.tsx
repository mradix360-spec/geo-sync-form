import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CustomWidget {
  id: string;
  name: string;
  description: string;
  widget_type: string;
  config: any;
  created_at: string;
}

export const CustomWidgetsList = () => {
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadCustomWidgets();
  }, [user?.organisation_id]);

  const loadCustomWidgets = async () => {
    if (!user?.organisation_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_widgets')
        .select('*')
        .eq('organisation_id', user.organisation_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWidgets(data || []);
    } catch (error: any) {
      console.error('Error loading custom widgets:', error);
      toast({
        title: "Error loading widgets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_widgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Widget deleted",
        description: "Custom widget has been removed",
      });

      loadCustomWidgets();
    } catch (error: any) {
      console.error('Error deleting widget:', error);
      toast({
        title: "Error deleting widget",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom AI Widgets</CardTitle>
          <CardDescription>Widgets created by AI for your organization</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (widgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom AI Widgets</CardTitle>
          <CardDescription>Widgets created by AI for your organization</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No custom widgets yet. AI will create them automatically when generating dashboards.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom AI Widgets</CardTitle>
        <CardDescription>Widgets created by AI for your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{widget.name}</h4>
                  <Badge variant="outline">{widget.widget_type}</Badge>
                </div>
                {widget.description && (
                  <p className="text-sm text-muted-foreground mb-2">{widget.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(widget.created_at).toLocaleDateString()}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Custom Widget</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{widget.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(widget.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
