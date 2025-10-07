import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";

interface ResponseListWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const ResponseListWidget = ({ config, onUpdate }: ResponseListWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadResponses();
    }
  }, [config.formId]);

  const loadForms = async () => {
    const { data } = await supabase.from("forms").select("id, title");
    setForms(data || []);
  };

  const loadResponses = async () => {
    const { data } = await supabase
      .from("form_responses")
      .select("*")
      .eq("form_id", config.formId)
      .order("created_at", { ascending: false })
      .limit(5);

    setResponses(data || []);
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Responses</CardTitle>
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
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {responses.map((response) => (
              <div key={response.id} className="p-2 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(response.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm mt-1 line-clamp-2">
                  {JSON.stringify(response.geojson?.properties || {}).slice(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </>
  );
};
