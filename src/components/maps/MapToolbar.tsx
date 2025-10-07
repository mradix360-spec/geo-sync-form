import { Button } from "@/components/ui/button";
import { Flame, Ruler, Pencil, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MapToolbarProps {
  onToggleHeatmap: () => void;
  onToggleMeasurement: () => void;
  onToggleDrawing: () => void;
  onExportMap: () => void;
  heatmapActive: boolean;
  measurementActive: boolean;
  drawingActive: boolean;
}

export const MapToolbar = ({
  onToggleHeatmap,
  onToggleMeasurement,
  onToggleDrawing,
  onExportMap,
  heatmapActive,
  measurementActive,
  drawingActive,
}: MapToolbarProps) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2 flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={heatmapActive ? "default" : "outline"}
              size="icon"
              onClick={onToggleHeatmap}
            >
              <Flame className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Heatmap</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={measurementActive ? "default" : "outline"}
              size="icon"
              onClick={onToggleMeasurement}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Measurement Tools</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={drawingActive ? "default" : "outline"}
              size="icon"
              onClick={onToggleDrawing}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Drawing Tools</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onExportMap}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export as Image</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
