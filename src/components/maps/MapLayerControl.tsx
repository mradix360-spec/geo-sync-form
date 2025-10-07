import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MapLayerControlProps {
  layers: Array<{
    id: string;
    formTitle: string;
    visible: boolean;
    color: string;
  }>;
  onToggleLayer: (layerId: string) => void;
}

export const MapLayerControl = ({ layers, onToggleLayer }: MapLayerControlProps) => {
  const [expanded, setExpanded] = useState(true);

  if (layers.length === 0) {
    return null;
  }

  return (
    <Card className="absolute top-6 right-6 z-[400] shadow-lg min-w-[220px]">
      <div 
        className="p-3 border-b bg-muted/50 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Layers</h3>
          <span className="text-xs text-muted-foreground">
            ({layers.filter(l => l.visible).length}/{layers.length})
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {expanded && (
        <ScrollArea className="max-h-[300px]">
          <div className="p-3 space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors cursor-pointer"
                onClick={() => onToggleLayer(layer.id)}
              >
                <Checkbox
                  checked={layer.visible}
                  onCheckedChange={() => onToggleLayer(layer.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div
                  className="w-3 h-3 rounded-sm border flex-shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-sm flex-1 truncate">{layer.formTitle}</span>
                {layer.visible ? (
                  <Eye className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                ) : (
                  <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};
