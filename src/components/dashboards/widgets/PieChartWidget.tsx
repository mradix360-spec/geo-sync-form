import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { WidgetConfig } from "../WidgetConfig";
import { calculateStatistics, filterByDateRange } from "@/lib/statistics";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface PieChartWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const PieChartWidget = ({ config, onUpdate }: PieChartWidgetProps) => {
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
  }, [config.formId, config.field, config.dateRange]);

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
        f.type === 'select' || f.type === 'text'
      );
      setFields(formFields);
    }
  };

  const loadData = async () => {
    const { data: responses } = await supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", config.formId);

    if (!responses || !config.field) return;

    const filteredData = responses.filter(r => 
      filterByDateRange(r.created_at, config.dateRange || 'all')
    );

    const values = filteredData.map(r => {
      const geojson = r.geojson as any;
      return String(geojson?.properties?.[config.field] || 'Unknown');
    });

    const counts = values.reduce((acc: any, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, config.limit || 10);

    setData(chartData);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 flex-shrink-0">
        <CardTitle className="text-sm font-medium flex-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {config.title || "Distribution"}
        </CardTitle>
        <WidgetConfig
          config={config}
          onUpdate={onUpdate}
          forms={forms}
          fields={fields}
          showColors={true}
        />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {COLORS.map((color, index) => (
                <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.6}/>
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              label={(entry) => `${entry.name}: ${entry.value}`}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={config.color || `url(#pieGradient${index % COLORS.length})`} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </div>
  );
};
