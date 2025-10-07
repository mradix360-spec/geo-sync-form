import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Plus, X, Trash2 } from "lucide-react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";

export const AttributeFilterWidget = () => {
  const { filters, addAttributeFilter, removeAttributeFilter, clearAttributeFilters } = useDashboardFilters();
  const [field, setField] = useState("");
  const [operator, setOperator] = useState<"eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "contains">("eq");
  const [value, setValue] = useState("");

  const handleAddFilter = () => {
    if (!field.trim() || !value.trim()) return;

    addAttributeFilter({
      field: field.trim(),
      operator,
      value: value.trim(),
    });

    setField("");
    setValue("");
  };

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      eq: "Equals",
      ne: "Not Equals",
      gt: "Greater Than",
      lt: "Less Than",
      gte: "Greater or Equal",
      lte: "Less or Equal",
      in: "In List",
      contains: "Contains",
    };
    return labels[op] || op;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Attribute Filters</CardTitle>
          </div>
          {filters.attributeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAttributeFilters}
              className="h-7"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Filter Form */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
          <div className="space-y-1.5">
            <Label htmlFor="field" className="text-xs">Field Name</Label>
            <Input
              id="field"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="e.g., status, count, name"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="operator" className="text-xs">Operator</Label>
            <Select value={operator} onValueChange={(v: any) => setOperator(v)}>
              <SelectTrigger id="operator" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eq">Equals (=)</SelectItem>
                <SelectItem value="ne">Not Equals (≠)</SelectItem>
                <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                <SelectItem value="gte">Greater or Equal (≥)</SelectItem>
                <SelectItem value="lte">Less or Equal (≤)</SelectItem>
                <SelectItem value="in">In List</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="value" className="text-xs">Value</Label>
            <div className="flex gap-2">
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
                className="h-8 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFilter();
                }}
              />
              <Button
                size="sm"
                onClick={handleAddFilter}
                disabled={!field.trim() || !value.trim()}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters List */}
        <div className="space-y-2">
          {filters.attributeFilters.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>No attribute filters active</p>
            </div>
          ) : (
            <>
              <Label className="text-xs text-muted-foreground">Active Filters</Label>
              <div className="space-y-2">
                {filters.attributeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {filter.field}
                      </code>
                      <Badge variant="secondary" className="text-xs">
                        {getOperatorLabel(filter.operator)}
                      </Badge>
                      <span className="text-xs text-foreground truncate">
                        {String(filter.value)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttributeFilter(index)}
                      className="h-7 w-7 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
