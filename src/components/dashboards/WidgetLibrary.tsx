import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Map,
  List,
  Grid3x3,
  Calendar,
  Users,
  MapPin,
  Activity,
  Target,
  Zap,
  Filter,
  Package,
  Sparkles,
} from "lucide-react";
import { CreateCustomWidgetDialog } from "./CreateCustomWidgetDialog";

interface WidgetType {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

const WIDGET_TYPES: WidgetType[] = [
  {
    id: "spatial-filter",
    name: "Spatial Filter",
    description: "Filter by location",
    icon: MapPin,
    category: "filters",
  },
  {
    id: "attribute-filter",
    name: "Attribute Filter",
    description: "Filter by attributes",
    icon: Filter,
    category: "filters",
  },
  {
    id: "stat-card",
    name: "Stat Card",
    description: "Display key metrics",
    icon: TrendingUp,
    category: "metrics",
  },
  {
    id: "bar-chart",
    name: "Bar Chart",
    description: "Compare values",
    icon: BarChart3,
    category: "charts",
  },
  {
    id: "pie-chart",
    name: "Pie Chart",
    description: "Show proportions",
    icon: PieChart,
    category: "charts",
  },
  {
    id: "line-chart",
    name: "Line Chart",
    description: "Trends over time",
    icon: LineChart,
    category: "charts",
  },
  {
    id: "map-widget",
    name: "Map Widget",
    description: "Display geographic data",
    icon: Map,
    category: "spatial",
  },
  {
    id: "response-list",
    name: "Response List",
    description: "Recent form responses",
    icon: List,
    category: "data",
  },
  {
    id: "data-table",
    name: "Data Table",
    description: "Tabular data view",
    icon: Grid3x3,
    category: "data",
  },
  {
    id: "activity-feed",
    name: "Activity Feed",
    description: "Recent activities",
    icon: Activity,
    category: "data",
  },
  {
    id: "calendar-widget",
    name: "Calendar",
    description: "Date-based data",
    icon: Calendar,
    category: "time",
  },
  {
    id: "user-stats",
    name: "User Stats",
    description: "User engagement metrics",
    icon: Users,
    category: "metrics",
  },
  {
    id: "location-heatmap",
    name: "Location Heatmap",
    description: "Geographic density",
    icon: MapPin,
    category: "spatial",
  },
  {
    id: "goal-tracker",
    name: "Goal Tracker",
    description: "Track targets",
    icon: Target,
    category: "metrics",
  },
  {
    id: "quick-stats",
    name: "Quick Stats",
    description: "Multiple metrics",
    icon: Zap,
    category: "metrics",
  },
];

interface WidgetLibraryProps {
  onAddWidget: (type: string, config?: any) => void;
}

interface CustomWidget {
  id: string;
  name: string;
  description: string;
  widget_type: string;
  config: any;
}

export const WidgetLibrary = ({ onAddWidget }: WidgetLibraryProps) => {
  const { user } = useAuth();
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCustomWidgets = async () => {
    if (!user?.organisation_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_widgets")
        .select("*")
        .eq("organisation_id", user.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomWidgets(data || []);
    } catch (error) {
      console.error("Error loading custom widgets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomWidgets();
  }, [user?.organisation_id]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <CreateCustomWidgetDialog onWidgetCreated={loadCustomWidgets} />
      </div>

      {customWidgets.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Custom Widgets ({customWidgets.length})
            </h3>
            <div className="grid gap-2">
              {customWidgets.map((widget) => (
                <Card
                  key={widget.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onAddWidget(widget.widget_type, widget.config)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {widget.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2">Standard Widgets</h3>
        <div className="grid gap-2">
          {WIDGET_TYPES.map((widget) => {
            const Icon = widget.icon;
            return (
              <Card
                key={widget.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onAddWidget(widget.id)}
              >
                <CardHeader className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {widget.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
