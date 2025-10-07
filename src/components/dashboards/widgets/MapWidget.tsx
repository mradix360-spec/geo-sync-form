import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/MapView";

interface MapWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const MapWidget = ({ config, onUpdate }: MapWidgetProps) => {
  const [maps, setMaps] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    loadMaps();
  }, []);

  useEffect(() => {
    if (config.mapId) {
      loadMapData();
    }
  }, [config.mapId]);

  const loadMaps = async () => {
    const { data } = await supabase.from("maps").select("id, title");
    setMaps(data || []);
  };

  const loadMapData = async () => {
    const { data: map } = await supabase
      .from("maps")
      .select("config")
      .eq("id", config.mapId)
      .single();

    if (map?.config) {
      const mapConfig = map.config as any;
      const allResponses: any[] = [];

      for (const layer of mapConfig.layers || []) {
        const { data } = await supabase
          .from("form_responses")
          .select("*")
          .eq("form_id", layer.formId);

        if (data) {
          allResponses.push(...data);
        }
      }

      setResponses(allResponses);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">Map View</CardTitle>
        <Select
          value={config.mapId}
          onValueChange={(value) => onUpdate({ ...config, mapId: value })}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select map" />
          </SelectTrigger>
          <SelectContent>
            {maps.map((map) => (
              <SelectItem key={map.id} value={map.id}>
                {map.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <div className="h-full">
          <MapView responses={responses} />
        </div>
      </CardContent>
    </div>
  );
};
