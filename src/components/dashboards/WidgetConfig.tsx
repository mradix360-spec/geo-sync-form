import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings2, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface WidgetConfigProps {
  config: any;
  onUpdate: (config: any) => void;
  forms: any[];
  fields: any[];
  showStatistics?: boolean;
  showColors?: boolean;
  showFilters?: boolean;
}

export const WidgetConfig = ({
  config,
  onUpdate,
  forms,
  fields,
  showStatistics = false,
  showColors = false,
  showFilters = false,
}: WidgetConfigProps) => {
  const statisticOptions = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average (Mean)' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'median', label: 'Median' },
    { value: 'stddev', label: 'Standard Deviation' },
    { value: 'variance', label: 'Variance' },
  ];

  const colorPresets = [
    { name: 'Primary', value: 'hsl(var(--primary))' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Pink', value: '#ec4899' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[500px] overflow-y-auto z-50" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Widget Configuration</h4>
            
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="widget-title">Title</Label>
              <Input
                id="widget-title"
                value={config.title || ''}
                onChange={(e) => onUpdate({ ...config, title: e.target.value })}
                placeholder="Widget title"
              />
            </div>
          </div>

          <Separator />

          {/* Data Source */}
          <div className="space-y-2">
            <Label htmlFor="form-select">Data Source</Label>
            <Select
              value={config.formId || ''}
              onValueChange={(value) => onUpdate({ ...config, formId: value, field: '' })}
            >
              <SelectTrigger id="form-select">
                <SelectValue placeholder="Select form" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          {fields.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="field-select">Field</Label>
              <Select
                value={config.field || ''}
                onValueChange={(value) => onUpdate({ ...config, field: value })}
              >
                <SelectTrigger id="field-select">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {fields.map((field) => (
                    <SelectItem key={field.label} value={field.label}>
                      {field.label} ({field.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Statistics */}
          {showStatistics && config.field && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="statistic-select">Statistic</Label>
                <Select
                  value={config.statistic || 'count'}
                  onValueChange={(value) => onUpdate({ ...config, statistic: value })}
                >
                  <SelectTrigger id="statistic-select">
                    <SelectValue placeholder="Select statistic" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {statisticOptions.map((stat) => (
                      <SelectItem key={stat.value} value={stat.value}>
                        {stat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Colors */}
          {showColors && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color.name}
                      className="h-10 rounded border-2 transition-all hover:scale-105"
                      style={{
                        backgroundColor: color.value,
                        borderColor: config.color === color.value ? 'hsl(var(--ring))' : 'transparent',
                      }}
                      onClick={() => onUpdate({ ...config, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={config.color || '#3b82f6'}
                  onChange={(e) => onUpdate({ ...config, color: e.target.value })}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </>
          )}

          {/* Filters */}
          {showFilters && config.field && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="filter-value">Filter</Label>
                <Input
                  id="filter-value"
                  value={config.filterValue || ''}
                  onChange={(e) => onUpdate({ ...config, filterValue: e.target.value })}
                  placeholder="Filter value (optional)"
                />
              </div>
            </>
          )}

          {/* Date Range */}
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="date-range">Date Range</Label>
            <Select
              value={config.dateRange || 'all'}
              onValueChange={(value) => onUpdate({ ...config, dateRange: value })}
            >
              <SelectTrigger id="date-range">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limit */}
          <div className="space-y-2">
            <Label htmlFor="limit">Result Limit</Label>
            <Input
              id="limit"
              type="number"
              min="1"
              max="100"
              value={config.limit || 10}
              onChange={(e) => onUpdate({ ...config, limit: parseInt(e.target.value) || 10 })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
