import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Plus, Settings } from "lucide-react";
import { useForms } from "@/hooks/use-forms";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SYMBOL_TYPES, SYMBOL_SIZES, SymbolType, SymbolSize } from "@/lib/mapSymbols";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface StyleRule {
  field: string;
  values: { value: string; color: string }[];
}

interface MapLayer {
  id: string;
  formId: string;
  formTitle: string;
  visible: boolean;
  color: string;
  symbolType?: SymbolType;
  symbolSize?: SymbolSize;
  styleRule?: StyleRule;
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
  onChangeStyleRule: (layerId: string, styleRule: StyleRule | undefined) => void;
}

export const MapLayerPanel = ({
  layers,
  onAddLayer,
  onRemoveLayer,
  onToggleLayer,
  onChangeColor,
  onChangeSymbol,
  onChangeSize,
  onChangeStyleRule,
}: MapLayerPanelProps) => {
  const { forms } = useForms();
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [currentLayerId, setCurrentLayerId] = useState<string>("");
  const [formFields, setFormFields] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Array<{ value: string; color: string }>>([]);
  const [currentLayer, setCurrentLayer] = useState<MapLayer | null>(null);

  const availableForms = forms.filter(
    (form) => !layers.some((layer) => layer.formId === form.id)
  );

  useEffect(() => {
    if (styleDialogOpen && currentLayer) {
      loadFormFields(currentLayer.formId);
      if (currentLayer.styleRule) {
        setSelectedField(currentLayer.styleRule.field);
        setFieldValues(currentLayer.styleRule.values);
      }
    }
  }, [styleDialogOpen, currentLayer]);

  const loadFormFields = async (formId: string) => {
    try {
      const { data: responses } = await supabase
        .from("form_responses")
        .select("geojson")
        .eq("form_id", formId)
        .limit(100);

      if (responses && responses.length > 0) {
        const fields = new Set<string>();
        responses.forEach(r => {
          const geojson = r.geojson as any;
          if (geojson?.properties) {
            Object.keys(geojson.properties).forEach(k => {
              if (k !== 'id') fields.add(k);
            });
          }
        });
        setFormFields(Array.from(fields));
      }
    } catch (error) {
      console.error("Error loading form fields:", error);
    }
  };

  const loadFieldValues = async (formId: string, field: string) => {
    try {
      const { data: responses } = await supabase
        .from("form_responses")
        .select("geojson")
        .eq("form_id", formId);

      if (responses) {
        const uniqueValues = new Set<string>();
        responses.forEach(r => {
          const geojson = r.geojson as any;
          if (geojson?.properties?.[field]) {
            uniqueValues.add(String(geojson.properties[field]));
          }
        });

        const values = Array.from(uniqueValues).map(v => ({
          value: v,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        }));
        setFieldValues(values);
      }
    } catch (error) {
      console.error("Error loading field values:", error);
    }
  };

  const handleAddLayer = () => {
    if (selectedFormId) {
      onAddLayer(selectedFormId);
      setSelectedFormId("");
    }
  };

  const handleOpenStyleDialog = (layer: MapLayer) => {
    setCurrentLayer(layer);
    setCurrentLayerId(layer.id);
    setStyleDialogOpen(true);
  };

  const handleApplyStyleRule = () => {
    if (selectedField && fieldValues.length > 0) {
      onChangeStyleRule(currentLayerId, {
        field: selectedField,
        values: fieldValues,
      });
    } else {
      onChangeStyleRule(currentLayerId, undefined);
    }
    setStyleDialogOpen(false);
    setSelectedField("");
    setFieldValues([]);
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
                  onClick={() => handleOpenStyleDialog(layer)}
                  className="h-8 w-8 p-0"
                  title="Attribute-based styling"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveLayer(layer.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {layer.styleRule && (
                <div className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded">
                  Styled by: {layer.styleRule.field}
                </div>
              )}

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

      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attribute-Based Styling</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Field</Label>
              <Select
                value={selectedField}
                onValueChange={(value) => {
                  setSelectedField(value);
                  if (currentLayer) {
                    loadFieldValues(currentLayer.formId, value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a field..." />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  {formFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fieldValues.length > 0 && (
              <div className="space-y-2">
                <Label>Assign Colors to Values</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {fieldValues.map((fv, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fv.color}
                        onChange={(e) => {
                          const updated = [...fieldValues];
                          updated[idx].color = e.target.value;
                          setFieldValues(updated);
                        }}
                        className="w-10 h-8 rounded cursor-pointer"
                      />
                      <span className="text-sm flex-1 truncate">{fv.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStyleDialogOpen(false);
                  setSelectedField("");
                  setFieldValues([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleApplyStyleRule}>
                Apply Style Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
