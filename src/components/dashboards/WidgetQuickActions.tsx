import { useState } from "react";
import { MoreVertical, RefreshCw, Download, Maximize2, Copy, Trash2, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface WidgetQuickActionsProps {
  widgetId: string;
  widgetType: string;
  widgetTitle?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onExpand?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onConfigure?: () => void;
}

export const WidgetQuickActions = ({
  widgetId,
  widgetType,
  widgetTitle,
  onRefresh,
  onExport,
  onExpand,
  onDuplicate,
  onDelete,
  onConfigure,
}: WidgetQuickActionsProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Refreshed",
        description: "Widget data has been refreshed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh widget",
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      toast({
        title: "Export Started",
        description: "Widget data is being exported",
      });
    }
  };

  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
      toast({
        title: "Widget Duplicated",
        description: "A copy of this widget has been created",
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      toast({
        title: "Widget Removed",
        description: "Widget has been removed from the dashboard",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent/80"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Widget actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onRefresh && (
          <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </DropdownMenuItem>
        )}
        {onExport && (
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </DropdownMenuItem>
        )}
        {onExpand && (
          <DropdownMenuItem onClick={handleExpand}>
            <Maximize2 className="mr-2 h-4 w-4" />
            Expand View
          </DropdownMenuItem>
        )}
        {onConfigure && (
          <DropdownMenuItem onClick={onConfigure}>
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </DropdownMenuItem>
        )}
        {(onRefresh || onExport || onExpand || onConfigure) && (onDuplicate || onDelete) && (
          <DropdownMenuSeparator />
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Widget
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Widget
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
