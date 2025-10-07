import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { WidgetConfig } from "../WidgetConfig";
import { calculateStatistics, filterByDateRange, formatStatisticValue } from "@/lib/statistics";

interface StatCardWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const StatCardWidget = ({ config, onUpdate }: StatCardWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [value, setValue] = useState(0);
  const [trend, setTrend] = useState(0);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadFields();
      loadStats();
    }
  }, [config.formId, config.field, config.statistic, config.dateRange, config.filterValue]);

  const loadForms = async () => {
    const { data } = await supabase.from("forms").select("id, title");
    setForms(data || []);
  };

  const loadFields = async () => {
    const { data } = await supabase
      .from("forms")
      .select("schema")
      .eq("id", config.formId)
      .single();

    if (data?.schema) {
      const formFields = ((data.schema as any)?.fields || []).filter((f: any) => 
        f.type === 'number' || f.type === 'text' || f.type === 'select'
      );
      setFields(formFields);
    }
  };

  const loadStats = async () => {
    let query = supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", config.formId);

    const { data } = await query;

    if (!data) return;

    // Apply date range filter
    const filteredData = data.filter(r => 
      filterByDateRange(r.created_at, config.dateRange || 'all')
    );

    // Extract values
    let values: number[] = [];
    if (config.field) {
      values = filteredData
        .map(r => {
          const geojson = r.geojson as any;
          const fieldValue = geojson?.properties?.[config.field];
          
          // Apply filter if specified
          if (config.filterValue && String(fieldValue) !== config.filterValue) {
            return null;
          }
          
          return parseFloat(fieldValue);
        })
        .filter(v => v !== null && !isNaN(v)) as number[];
    } else {
      values = filteredData.map(() => 1);
    }

    // Calculate statistic
    const statistic = config.statistic || 'count';
    const calculatedValue = calculateStatistics(values, statistic);
    setValue(calculatedValue);

    // Calculate trend (last 30 days vs previous period)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recent = filteredData.filter(r => 
      new Date(r.created_at) >= thirtyDaysAgo
    );
    const previous = filteredData.filter(r => 
      new Date(r.created_at) >= sixtyDaysAgo && new Date(r.created_at) < thirtyDaysAgo
    );

    const recentCount = recent.length;
    const previousCount = previous.length;
    
    setTrend(previousCount > 0 ? ((recentCount - previousCount) / previousCount) * 100 : 0);
  };

  return (
    <>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {config.title || "Statistic"}
        </CardTitle>
        <WidgetConfig
          config={config}
          onUpdate={onUpdate}
          forms={forms}
          fields={fields}
          showStatistics={true}
          showColors={true}
          showFilters={true}
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-3 mb-3">
          <div className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent animate-scale-in" style={{ 
            color: config.color,
            WebkitTextFillColor: config.color || undefined 
          }}>
            {formatStatisticValue(value, config.statistic || 'count')}
          </div>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium animate-fade-in ${
              trend > 0 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {config.field 
              ? `${config.statistic?.toUpperCase() || 'COUNT'} of ${config.field}`
              : 'Total count'
            }
          </p>
          <p className="text-xs text-muted-foreground/70">vs previous 30 days</p>
        </div>
      </CardContent>
    </>
  );
};
