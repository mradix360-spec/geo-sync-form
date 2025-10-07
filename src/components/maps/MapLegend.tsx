import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers } from "lucide-react";

interface LegendItem {
  label: string;
  color: string;
  symbolType?: string;
  count?: number;
}

interface MapLegendProps {
  layers: Array<{
    formTitle: string;
    visible: boolean;
    color: string;
    symbolType?: string;
    styleRule?: {
      field: string;
      symbologyType?: string;
      values: { value: string; color: string }[];
    };
    responses?: any[];
  }>;
}

export const MapLegend = ({ layers }: MapLegendProps) => {
  const visibleLayers = layers.filter(l => l.visible);

  if (visibleLayers.length === 0) {
    return null;
  }

  const getLegendItems = (layer: typeof visibleLayers[0]): LegendItem[] => {
    if (layer.styleRule) {
      if (layer.styleRule.symbologyType === 'single') {
        return [{
          label: layer.formTitle,
          color: layer.styleRule.values[0]?.color || layer.color,
          symbolType: layer.symbolType,
          count: layer.responses?.length || 0,
        }];
      } else {
        // Unique values
        return layer.styleRule.values.map(v => {
          const count = layer.responses?.filter(r => {
            const geojson = r.geojson as any;
            return String(geojson?.properties?.[layer.styleRule!.field]) === v.value;
          }).length || 0;
          
          return {
            label: v.value,
            color: v.color,
            symbolType: layer.symbolType,
            count,
          };
        });
      }
    }
    
    // No style rule - single color
    return [{
      label: layer.formTitle,
      color: layer.color,
      symbolType: layer.symbolType,
      count: layer.responses?.length || 0,
    }];
  };

  return (
    <Card className="absolute bottom-6 left-6 z-[400] shadow-lg min-w-[200px] max-w-[280px]">
      <div className="p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Legend</h3>
        </div>
      </div>
      <ScrollArea className="max-h-[300px]">
        <div className="p-3 space-y-3">
          {visibleLayers.map((layer, layerIdx) => {
            const items = getLegendItems(layer);
            
            return (
              <div key={layerIdx} className="space-y-2">
                {layer.styleRule && layer.styleRule.symbologyType !== 'single' && (
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    {layer.formTitle}
                  </div>
                )}
                
                {items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-4 h-4 rounded border flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{item.label}</span>
                      {item.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {item.count} point{item.count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
