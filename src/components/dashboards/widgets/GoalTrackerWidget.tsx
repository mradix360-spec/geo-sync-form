import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface GoalTrackerWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const GoalTrackerWidget = ({ config, onUpdate }: GoalTrackerWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const target = config.target || 100;

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadProgress();
    }
  }, [config.formId]);

  const loadForms = async () => {
    const { data } = await supabase.from("forms").select("id, title");
    setForms(data || []);
  };

  const loadProgress = async () => {
    const { data } = await supabase
      .from("form_responses")
      .select("id")
      .eq("form_id", config.formId);

    setCurrent(data?.length || 0);
  };

  const percentage = Math.min((current / target) * 100, 100);

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Goal Tracker</CardTitle>
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <Input
              id="target"
              type="number"
              value={target}
              onChange={(e) => onUpdate({ ...config, target: parseInt(e.target.value) || 100 })}
              placeholder="Set target"
            />
          </div>
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>{current} completed</span>
                <span>{target} goal</span>
              </div>
              <Progress value={percentage} />
              <p className="text-xs text-muted-foreground mt-1">
                {percentage.toFixed(0)}% complete
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};
