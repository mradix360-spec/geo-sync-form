import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const DataTableWidget = ({ config, onUpdate }: DataTableWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [fields, setFields] = useState<string[]>([]);

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
      .select("*")
      .eq("form_id", config.formId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (form?.schema) {
      const formFields = ((form.schema as any)?.fields || []).map((f: any) => f.label);
      setFields(formFields);
    }

    setResponses(responses || []);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">Data Table</CardTitle>
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
      <CardContent className="flex-1 min-h-0 overflow-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {fields.slice(0, 3).map((field) => (
                  <TableHead key={field}>{field}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id}>
                  {fields.slice(0, 3).map((field) => (
                    <TableCell key={field} className="text-xs">
                      {String(response.geojson?.properties?.[field] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </div>
  );
};
