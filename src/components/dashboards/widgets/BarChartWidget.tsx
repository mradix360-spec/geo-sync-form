import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { WidgetConfig } from "../WidgetConfig";
import { calculateStatistics, filterByDateRange } from "@/lib/statistics";

interface BarChartWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const BarChartWidget = ({ config, onUpdate }: BarChartWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadFields();
      loadData();
    }
  }, [config.formId, config.field, config.statistic, config.dateRange]);

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
      const formFields = ((data.schema as any)?.fields || []);
      setFields(formFields);
    }
  };

  const loadData = async () => {
    const { data: responses } = await supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", config.formId);

    if (!responses) return;

    const filteredData = responses.filter(r => 
      filterByDateRange(r.created_at, config.dateRange || 'all')
    );

    if (config.field) {
      // Group by field value
      const grouped = filteredData.reduce((acc: any, r) => {
        const geojson = r.geojson as any;
        const value = String(geojson?.properties?.[config.field] || 'Unknown');
        
        if (!acc[value]) {
          acc[value] = [];
        }
        
        const numValue = parseFloat(geojson?.properties?.[config.field]);
        if (!isNaN(numValue)) {
          acc[value].push(numValue);
        } else {
          acc[value].push(1);
        }
        
        return acc;
      }, {});

      const chartData = Object.entries(grouped).map(([category, values]: [string, any]) => ({
        category,
        value: calculateStatistics(values, config.statistic || 'count'),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, config.limit || 10);

      setData(chartData);
    } else {
      // Group by time period
      const timeGrouped = filteredData.reduce((acc: any, r) => {
        const date = new Date(r.created_at);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(timeGrouped).map(([category, value]) => ({
        category,
        value,
      }));

      setData(chartData);
    }
  };

  return (
    <>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex-1">
          {config.title || "Bar Chart"}
        </CardTitle>
        <WidgetConfig
          config={config}
          onUpdate={onUpdate}
          forms={forms}
          fields={fields}
          showStatistics={true}
          showColors={true}
        />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={config.color || "hsl(var(--primary))"} 
              name={config.statistic?.toUpperCase() || 'COUNT'}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  );
};
