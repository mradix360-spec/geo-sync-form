import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";

interface CalendarWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const CalendarWidget = ({ config, onUpdate }: CalendarWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadDates();
    }
  }, [config.formId]);

  const loadForms = async () => {
    const { data } = await supabase.from("forms").select("id, title");
    setForms(data || []);
  };

  const loadDates = async () => {
    const { data } = await supabase
      .from("form_responses")
      .select("created_at")
      .eq("form_id", config.formId);

    const responseDates = data?.map(r => new Date(r.created_at)) || [];
    setDates(responseDates);
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Response Calendar</CardTitle>
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
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{ hasResponse: dates }}
          modifiersStyles={{
            hasResponse: { backgroundColor: 'hsl(var(--primary))', color: 'white' }
          }}
        />
      </CardContent>
    </>
  );
};
