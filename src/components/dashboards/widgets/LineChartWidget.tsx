import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LineChartWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const LineChartWidget = ({ config, onUpdate }: LineChartWidgetProps) => {
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
      .eq("form_id", config.formId)
      .order("created_at", { ascending: true });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const counts = last30Days.map(day => ({
      date: day,
      responses: 0,
    }));

    responses?.forEach(r => {
      const responseDate = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const index = counts.findIndex(c => c.date === responseDate);
      if (index !== -1) {
        counts[index].responses++;
      }
    });

    setData(counts);
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">30-Day Trend</CardTitle>
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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="responses" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  );
};
