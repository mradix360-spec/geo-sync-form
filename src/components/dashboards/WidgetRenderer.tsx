import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatCardWidget } from "./widgets/StatCardWidget";
import { BarChartWidget } from "./widgets/BarChartWidget";
import { PieChartWidget } from "./widgets/PieChartWidget";
import { LineChartWidget } from "./widgets/LineChartWidget";
import { MapWidget } from "./widgets/MapWidget";
import { ResponseListWidget } from "./widgets/ResponseListWidget";
import { DataTableWidget } from "./widgets/DataTableWidget";
import { ActivityFeedWidget } from "./widgets/ActivityFeedWidget";
import { CalendarWidget } from "./widgets/CalendarWidget";
import { UserStatsWidget } from "./widgets/UserStatsWidget";
import { LocationHeatmapWidget } from "./widgets/LocationHeatmapWidget";
import { GoalTrackerWidget } from "./widgets/GoalTrackerWidget";
import { QuickStatsWidget } from "./widgets/QuickStatsWidget";
import { SpatialFilterWidget } from "./widgets/SpatialFilterWidget";
import { AttributeFilterWidget } from "./widgets/AttributeFilterWidget";
import { WidgetQuickActions } from "./WidgetQuickActions";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface WidgetRendererProps {
  widget: {
    id: string;
    type: string;
    config: any;
  };
  onUpdate: (config: any) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const WidgetRenderer = ({ widget, onUpdate, onDelete, onDuplicate }: WidgetRendererProps) => {
  const { type, config } = widget;
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = () => {
    // Export functionality - can be expanded based on widget type
    console.log("Exporting widget data:", widget.id);
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const renderWidget = () => {
    switch (type) {
      case "spatial-filter":
        return <SpatialFilterWidget key={refreshKey} />;
      case "attribute-filter":
        return <AttributeFilterWidget key={refreshKey} />;
      case "stat-card":
        return <StatCardWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "bar-chart":
        return <BarChartWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "pie-chart":
        return <PieChartWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "line-chart":
        return <LineChartWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "map-widget":
        return <MapWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "response-list":
        return <ResponseListWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "data-table":
        return <DataTableWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "activity-feed":
        return <ActivityFeedWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "calendar-widget":
        return <CalendarWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "user-stats":
        return <UserStatsWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "location-heatmap":
        return <LocationHeatmapWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "goal-tracker":
        return <GoalTrackerWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      case "quick-stats":
        return <QuickStatsWidget key={refreshKey} config={config} onUpdate={onUpdate} />;
      default:
        return <div className="p-4 text-muted-foreground">Unknown widget type: {type}</div>;
    }
  };

  return (
    <>
      <Card className="h-full group relative overflow-hidden border border-border/50 bg-card/95 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02]">
        {/* Glass-morphism gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
        
        {/* Quick Actions Menu */}
        <div className="absolute top-2 right-2 z-20">
          <WidgetQuickActions
            widgetId={widget.id}
            widgetType={type}
            widgetTitle={config.title}
            onRefresh={handleRefresh}
            onExport={handleExport}
            onExpand={handleExpand}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 h-full">
          {renderWidget()}
        </div>
      </Card>

      {/* Expanded View Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <div className="h-full overflow-auto">
            {renderWidget()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
