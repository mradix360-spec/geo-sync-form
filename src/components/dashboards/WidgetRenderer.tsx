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

interface WidgetRendererProps {
  widget: {
    id: string;
    type: string;
    config: any;
  };
  onUpdate: (config: any) => void;
}

export const WidgetRenderer = ({ widget, onUpdate }: WidgetRendererProps) => {
  const { type, config } = widget;

  const renderWidget = () => {
    switch (type) {
      case "spatial-filter":
        return <SpatialFilterWidget />;
      case "attribute-filter":
        return <AttributeFilterWidget />;
      case "stat-card":
        return <StatCardWidget config={config} onUpdate={onUpdate} />;
      case "bar-chart":
        return <BarChartWidget config={config} onUpdate={onUpdate} />;
      case "pie-chart":
        return <PieChartWidget config={config} onUpdate={onUpdate} />;
      case "line-chart":
        return <LineChartWidget config={config} onUpdate={onUpdate} />;
      case "map-widget":
        return <MapWidget config={config} onUpdate={onUpdate} />;
      case "response-list":
        return <ResponseListWidget config={config} onUpdate={onUpdate} />;
      case "data-table":
        return <DataTableWidget config={config} onUpdate={onUpdate} />;
      case "activity-feed":
        return <ActivityFeedWidget config={config} onUpdate={onUpdate} />;
      case "calendar-widget":
        return <CalendarWidget config={config} onUpdate={onUpdate} />;
      case "user-stats":
        return <UserStatsWidget config={config} onUpdate={onUpdate} />;
      case "location-heatmap":
        return <LocationHeatmapWidget config={config} onUpdate={onUpdate} />;
      case "goal-tracker":
        return <GoalTrackerWidget config={config} onUpdate={onUpdate} />;
      case "quick-stats":
        return <QuickStatsWidget config={config} onUpdate={onUpdate} />;
      default:
        return <div className="p-4 text-muted-foreground">Unknown widget type: {type}</div>;
    }
  };

  return (
    <div className="h-full w-full">
      {renderWidget()}
    </div>
  );
};
