import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Basemap {
  id: string;
  name: string;
  url: string;
  attribution: string;
  thumbnail: string;
}

interface MapBasemapPanelProps {
  basemaps: Basemap[];
  selectedBasemap: Basemap;
  onSelectBasemap: (basemap: Basemap) => void;
}

export const MapBasemapPanel = ({
  basemaps,
  selectedBasemap,
  onSelectBasemap,
}: MapBasemapPanelProps) => {
  return (
    <div className="space-y-4 pt-4">
      <Label className="text-sm font-medium">Select Basemap</Label>
      <div className="grid grid-cols-2 gap-2">
        {basemaps.map((basemap) => (
          <Button
            key={basemap.id}
            variant={selectedBasemap.id === basemap.id ? "default" : "outline"}
            className="h-auto flex-col gap-2 p-4 relative"
            onClick={() => onSelectBasemap(basemap)}
          >
            {selectedBasemap.id === basemap.id && (
              <Check className="w-4 h-4 absolute top-2 right-2" />
            )}
            <span className="text-3xl">{basemap.thumbnail}</span>
            <span className="text-xs font-medium">{basemap.name}</span>
          </Button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground p-2 rounded bg-muted">
        <strong>Current:</strong> {selectedBasemap.name}
      </div>
    </div>
  );
};
