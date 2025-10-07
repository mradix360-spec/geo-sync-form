import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WidgetLibrary } from "@/components/dashboards/WidgetLibrary";
import { WidgetRenderer } from "@/components/dashboards/WidgetRenderer";
import { Card } from "@/components/ui/card";

interface DashboardWidget {
  id: string;
  type: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

const DashboardBuilder = () => {
  const navigate = useNavigate();
  const { dashboardId } = useParams<{ dashboardId?: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [shareType, setShareType] = useState("private");

  useEffect(() => {
    if (dashboardId) {
      loadDashboard();
    }
  }, [dashboardId]);

  const loadDashboard = async () => {
    if (!dashboardId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .eq("id", dashboardId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setDescription(data.description || "");
      
      const config = (data.config || {}) as any;
      if (config.widgets && Array.isArray(config.widgets)) {
        setWidgets(config.widgets);
      }

      const { data: shareData } = await supabase
        .from("shares")
        .select("access_type")
        .eq("object_id", dashboardId)
        .eq("object_type", "dashboard")
        .single();

      if (shareData) {
        setShareType(shareData.access_type);
      }
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Dashboard title is required",
      });
      return;
    }

    try {
      setSaving(true);

      const dashboardConfig = {
        widgets: widgets.map(w => ({
          id: w.id,
          type: w.type,
          config: w.config,
          position: w.position,
        })),
        layout: widgets.map(w => w.position),
      } as any;

      if (dashboardId) {
        const { error } = await supabase
          .from("dashboards")
          .update({
            title,
            description,
            config: dashboardConfig,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dashboardId);

        if (error) throw error;

        const { data: existingShare } = await supabase
          .from("shares")
          .select("id")
          .eq("object_id", dashboardId)
          .eq("object_type", "dashboard")
          .single();

        if (shareType === "private" && existingShare) {
          await supabase.from("shares").delete().eq("id", existingShare.id);
        } else if (shareType !== "private") {
          if (existingShare) {
            await supabase
              .from("shares")
              .update({ access_type: shareType })
              .eq("id", existingShare.id);
          } else {
            await supabase.from("shares").insert({
              object_id: dashboardId,
              object_type: "dashboard",
              access_type: shareType,
              organisation_id: user?.organisation_id,
            });
          }
        }

        toast({
          title: "Success",
          description: "Dashboard updated successfully",
        });
      } else {
        const { data: newDashboard, error: dashboardError } = await supabase
          .from("dashboards")
          .insert([{
            title,
            description,
            config: dashboardConfig,
            organisation_id: user?.organisation_id,
            created_by: user?.id,
          }])
          .select()
          .single();

        if (dashboardError) throw dashboardError;

        if (shareType !== "private") {
          await supabase.from("shares").insert({
            object_id: newDashboard.id,
            object_type: "dashboard",
            access_type: shareType,
            organisation_id: user?.organisation_id,
          });
        }

        toast({
          title: "Success",
          description: "Dashboard created successfully",
        });

        navigate(`/dashboard-builder/${newDashboard.id}`);
      }
    } catch (error: any) {
      console.error("Error saving dashboard:", error);
      toast({
        variant: "destructive",
        title: "Error saving dashboard",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddWidget = (type: string, config: any = {}) => {
    const newWidget: DashboardWidget = {
      id: crypto.randomUUID(),
      type,
      config,
      position: {
        x: widgets.length % 3,
        y: Math.floor(widgets.length / 3),
        w: 1,
        h: 1,
      },
    };

    setWidgets([...widgets, newWidget]);
    toast({
      title: "Widget Added",
      description: `${type} widget added to dashboard`,
    });
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const handleUpdateWidget = (widgetId: string, config: any) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, config } : w
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 justify-between z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/analyst/dashboards")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboards
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {dashboardId ? "Edit Dashboard" : "Create Dashboard"}
            </h1>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Dashboard"}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 w-full overflow-hidden">
          <Sidebar collapsible="icon" className="border-r">
            <SidebarContent>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Dashboard Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter dashboard title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter dashboard description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Widget Library</Label>
                    <WidgetLibrary onAddWidget={handleAddWidget} />
                  </div>
                </div>
              </ScrollArea>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 p-6 overflow-auto bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
              {widgets.map((widget) => (
                <Card key={widget.id} className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveWidget(widget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <WidgetRenderer
                    widget={widget}
                    onUpdate={(config) => handleUpdateWidget(widget.id, config)}
                  />
                </Card>
              ))}
            </div>

            {widgets.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <Plus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No widgets yet</h3>
                  <p className="text-muted-foreground">
                    Add widgets from the sidebar to start building your dashboard
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardBuilder;
