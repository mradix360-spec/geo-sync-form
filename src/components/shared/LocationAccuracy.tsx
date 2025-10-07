import { MapPin, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LocationAccuracyProps {
  accuracy?: number;
  lat?: number;
  lng?: number;
}

export const LocationAccuracy = ({ accuracy, lat, lng }: LocationAccuracyProps) => {
  if (!lat || !lng) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        No Location
      </Badge>
    );
  }

  const getAccuracyLevel = (acc?: number) => {
    if (!acc) return { level: 'unknown', color: 'secondary' as const };
    if (acc < 10) return { level: 'excellent', color: 'default' as const };
    if (acc < 50) return { level: 'good', color: 'default' as const };
    if (acc < 100) return { level: 'fair', color: 'secondary' as const };
    return { level: 'poor', color: 'destructive' as const };
  };

  const { level, color } = getAccuracyLevel(accuracy);

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={color} className="gap-1">
          <MapPin className="h-3 w-3" />
          {accuracy ? `±${accuracy.toFixed(0)}m` : 'Located'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-semibold">GPS Accuracy: {level}</p>
          <p className="text-xs">Lat: {lat.toFixed(6)}</p>
          <p className="text-xs">Lng: {lng.toFixed(6)}</p>
          {accuracy && <p className="text-xs">±{accuracy.toFixed(1)} meters</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
