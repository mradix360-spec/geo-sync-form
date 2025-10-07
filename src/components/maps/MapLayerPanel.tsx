import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Plus, Settings, X } from "lucide-react";
import { useForms } from "@/hooks/use-forms";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type SymbologyType = 'single' | 'unique' | 'categorical';

interface StyleRule {
  field: string;
  symbologyType?: SymbologyType;
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
  const [symbologyType, setSymbologyType] = useState<SymbologyType>('unique');
  const [singleColor, setSingleColor] = useState<string>('#3b82f6');
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
        setSymbologyType(currentLayer.styleRule.symbologyType || 'unique');
        setFieldValues(currentLayer.styleRule.values);
        if (currentLayer.styleRule.symbologyType === 'single' && currentLayer.styleRule.values[0]) {
          setSingleColor(currentLayer.styleRule.values[0].color);
        }
      } else {
        // Reset to defaults
        setSelectedField("");
        setSymbologyType('unique');
        setSingleColor('#3b82f6');
        setFieldValues([]);
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

  const handleSymbologyTypeChange = (type: SymbologyType) => {
    setSymbologyType(type);
    
    if (type === 'single') {
      // Single value - one color for all
      setFieldValues([{ value: '*', color: singleColor }]);
    } else if (type === 'unique' && selectedField && currentLayer) {
      // Unique values - reload field values
      loadFieldValues(currentLayer.formId, selectedField);
    }
  };

  const handleApplyStyleRule = () => {
    if (!selectedField) {
      onChangeStyleRule(currentLayerId, undefined);
      setStyleDialogOpen(false);
      return;
    }

    if (symbologyType === 'single') {
      onChangeStyleRule(currentLayerId, {
        field: selectedField,
        symbologyType: 'single',
        values: [{ value: '*', color: singleColor }],
      });
    } else if (fieldValues.length > 0) {
      onChangeStyleRule(currentLayerId, {
        field: selectedField,
        symbologyType,
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
            <SelectContent className="z-[9999] bg-popover">
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
                <div className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded flex items-center justify-between">
                  <span>
                    {layer.styleRule.symbologyType === 'single' ? 'Single color' : 
                     layer.styleRule.symbologyType === 'categorical' ? 'Categorical' : 
                     `Styled by: ${layer.styleRule.field}`}
                  </span>
                  {layer.styleRule.values.length > 0 && layer.styleRule.symbologyType !== 'single' && (
                    <span className="text-xs font-medium">
                      {layer.styleRule.values.length} values
                    </span>
                  )}
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
                    <SelectContent className="z-[9999] bg-popover">
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
                    <SelectContent className="z-[9999] bg-popover">
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
        <DialogContent className="max-w-2xl max-h-[85vh] z-[10000] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">Symbology Settings</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure how markers are styled based on data attributes
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setStyleDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {/* Field Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Data Field</Label>
              <Select
                value={selectedField}
                onValueChange={(value) => {
                  setSelectedField(value);
                  if (currentLayer && symbologyType !== 'single') {
                    loadFieldValues(currentLayer.formId, value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select field to style by..." />
                </SelectTrigger>
                <SelectContent className="z-[10001] bg-popover max-h-[200px]">
                  {formFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedField && (
                <p className="text-xs text-muted-foreground">
                  Select a field from your form data to begin styling
                </p>
              )}
            </div>

            {/* Symbology Type */}
            {selectedField && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Symbology Type</Label>
                <RadioGroup
                  value={symbologyType}
                  onValueChange={(value) => handleSymbologyTypeChange(value as SymbologyType)}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="single" id="single" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="single" className="font-medium cursor-pointer">
                        Single Symbol
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Use one color for all features
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="unique" id="unique" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="unique" className="font-medium cursor-pointer">
                        Unique Values
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Different color for each unique value
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="categorical" id="categorical" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="categorical" className="font-medium cursor-pointer">
                        Categorical
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Group similar values into categories
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Single Color Picker */}
            {selectedField && symbologyType === 'single' && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Symbol Color</Label>
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <input
                    type="color"
                    value={singleColor}
                    onChange={(e) => setSingleColor(e.target.value)}
                    className="w-16 h-16 rounded cursor-pointer border-2"
                  />
                  <div>
                    <p className="font-medium">All markers</p>
                    <p className="text-sm text-muted-foreground">{singleColor}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Unique Values Color Assignment */}
            {selectedField && symbologyType === 'unique' && fieldValues.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Color Assignment</Label>
                  <span className="text-sm text-muted-foreground">
                    {fieldValues.length} unique value{fieldValues.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border p-3 bg-muted/30">
                  {fieldValues.map((fv, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded bg-card hover:bg-accent/50 transition-colors">
                      <input
                        type="color"
                        value={fv.color}
                        onChange={(e) => {
                          const updated = [...fieldValues];
                          updated[idx].color = e.target.value;
                          setFieldValues(updated);
                        }}
                        className="w-12 h-12 rounded cursor-pointer border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fv.value}</p>
                        <p className="text-xs text-muted-foreground">{fv.color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorical (placeholder for future) */}
            {selectedField && symbologyType === 'categorical' && (
              <div className="p-6 rounded-lg border border-dashed bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">
                  Categorical symbology allows you to group values into custom categories.
                  This feature is coming soon!
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                onChangeStyleRule(currentLayerId, undefined);
                setStyleDialogOpen(false);
              }}
            >
              Clear Styling
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStyleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApplyStyleRule}
                disabled={!selectedField || (symbologyType === 'unique' && fieldValues.length === 0)}
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
