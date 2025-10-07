import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface PieChartWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const PieChartWidget = ({ config, onUpdate }: PieChartWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadData();
    }
  }, [config.formId]);

  const loadForms = async () => {
    const { data } = await supabase.from("forms").select("id, title");
    setForms(data || []);
  };

  const loadData = async () => {
    const { data: form } = await supabase
      .from("forms")
      .select("schema")
      .eq("id", config.formId)
      .single();

    const { data: responses } = await supabase
      .from("form_responses")
      .select("geojson")
      .eq("form_id", config.formId);

    if (form?.schema && responses) {
      const fields = (form.schema as any)?.fields || [];
      const selectField = fields.find((f: any) => f.type === 'select');
      
      if (selectField) {
        const values = responses.map(r => {
          const geojson = r.geojson as any;
          return geojson?.properties?.[selectField.label];
        }).filter(Boolean);
        const counts = values.reduce((acc: any, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(counts).map(([name, value]) => ({
          name,
          value,
        }));

        setData(chartData);
      }
    }
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Distribution</CardTitle>
        <Select
          value={config.formId}
          onValueChange={(value) => onUpdate({ ...config, formId: value })}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select form" />
          </SelectTrigger>
          <SelectContent>
            {forms.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  );
};
