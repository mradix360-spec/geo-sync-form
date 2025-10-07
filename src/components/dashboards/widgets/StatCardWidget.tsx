import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const StatCardWidget = ({ config, onUpdate }: StatCardWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [trend, setTrend] = useState(0);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadStats();
    }
  }, [config.formId]);

  const loadForms = async () => {
    const { data } = await supabase.from("forms").select("id, title");
    setForms(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", config.formId);

    setCount(data?.length || 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentData = data?.filter(r => 
      new Date(r.created_at) >= thirtyDaysAgo
    );
    
    setTrend(((recentData?.length || 0) / (data?.length || 1)) * 100);
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {config.title || "Total Responses"}
        </CardTitle>
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
        <div className="text-3xl font-bold">{count}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          {trend > 50 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span>{trend.toFixed(0)}% from last 30 days</span>
        </div>
      </CardContent>
    </>
  );
};
