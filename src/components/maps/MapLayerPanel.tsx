import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { useForms } from "@/hooks/use-forms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SYMBOL_TYPES, SYMBOL_SIZES, SymbolType, SymbolSize } from "@/lib/mapSymbols";

interface MapLayer {
  id: string;
  formId: string;
  formTitle: string;
  visible: boolean;
  color: string;
  symbolType?: SymbolType;
  symbolSize?: SymbolSize;
  responses?: any[];
}

interface MapLayerPanelProps {
  layers: MapLayer[];
  onAddLayer: (formId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  onToggleLayer: (layerId: string) => void;
  onChangeColor: (layerId: string, color: string) => void;
  onChangeSymbol: (layerId: string, symbolType: SymbolType) => void;
  onChangeSize: (layerId: string, symbolSize: SymbolSize) => void;
}

export const MapLayerPanel = ({
  layers,
  onAddLayer,
  onRemoveLayer,
  onToggleLayer,
  onChangeColor,
  onChangeSymbol,
  onChangeSize,
}: MapLayerPanelProps) => {
  const { forms } = useForms();
  const [selectedFormId, setSelectedFormId] = useState<string>("");

  const availableForms = forms.filter(
    (form) => !layers.some((layer) => layer.formId === form.id)
  );

  const handleAddLayer = () => {
    if (selectedFormId) {
      onAddLayer(selectedFormId);
      setSelectedFormId("");
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Add Layer</Label>
        <div className="flex gap-2">
          <Select value={selectedFormId} onValueChange={setSelectedFormId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select form..." />
            </SelectTrigger>
            <SelectContent>
              {availableForms.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAddLayer}
            disabled={!selectedFormId}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {layers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>No layers added yet</p>
          <p className="text-xs mt-1">Select a form above to add a layer</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Layers ({layers.length})</Label>
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="space-y-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLayer(layer.id)}
                  className="h-8 w-8 p-0"
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>

                <input
                  type="color"
                  value={layer.color}
                  onChange={(e) => onChangeColor(layer.id, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                  title="Change color"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{layer.formTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {layer.responses?.length || 0} points
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveLayer(layer.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Symbol</Label>
                  <Select
                    value={layer.symbolType || 'circle'}
                    onValueChange={(value) => onChangeSymbol(layer.id, value as SymbolType)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOL_TYPES.map((symbol) => (
                        <SelectItem key={symbol.id} value={symbol.id} className="text-xs">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{symbol.icon}</span>
                            {symbol.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Select
                    value={layer.symbolSize || 'medium'}
                    onValueChange={(value) => onChangeSize(layer.id, value as SymbolSize)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOL_SIZES.map((size) => (
                        <SelectItem key={size.id} value={size.id} className="text-xs">
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
