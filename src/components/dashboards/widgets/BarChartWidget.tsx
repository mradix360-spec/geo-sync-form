import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BarChartWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const BarChartWidget = ({ config, onUpdate }: BarChartWidgetProps) => {
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
    const { data: responses } = await supabase
      .from("form_responses")
      .select("created_at")
      .eq("form_id", config.formId);

    const monthCounts = responses?.reduce((acc: any, r) => {
      const month = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(monthCounts || {}).map(([month, count]) => ({
      month,
      responses: count,
    }));

    setData(chartData);
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Response Trends</CardTitle>
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
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="responses" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  );
};
