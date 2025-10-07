import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

interface LocationHeatmapWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const LocationHeatmapWidget = ({ config, onUpdate }: LocationHeatmapWidgetProps) => {
  const [forms, setForms] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (config.formId) {
      loadLocationData();
    }
  }, [config.formId]);

  const loadForms = async () => {
    const { data } = await supabase.from("forms").select("id, title");
    setForms(data || []);
  };

  const loadLocationData = async () => {
    const { data } = await supabase
      .from("form_responses")
      .select("geojson")
      .eq("form_id", config.formId);

    const locations = data?.map(r => {
      const geojson = r.geojson as any;
      return {
        lat: geojson?.geometry?.coordinates?.[1],
        lng: geojson?.geometry?.coordinates?.[0],
      };
    }).filter(l => l.lat && l.lng) || [];

    const grouped = locations.reduce((acc: any, loc) => {
      const key = `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const heatmapData = Object.entries(grouped).map(([key, count]) => ({
      location: key,
      count,
    }));

    setLocationData(heatmapData.slice(0, 5));
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">Location Density</CardTitle>
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
      <CardContent className="flex-1 flex flex-col justify-center overflow-auto">
        <div className="space-y-2">
          {locationData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">{item.location}</span>
              </div>
              <div className="text-sm font-semibold">{item.count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </div>
  );
};
