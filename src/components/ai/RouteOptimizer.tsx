import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Route, Clock, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  priority?: "low" | "normal" | "high";
  urgency?: "low" | "medium" | "high";
}

interface RouteOptimization {
  optimizedOrder: number[];
  estimatedDistance: string;
  estimatedTime: string;
  reasoning: string;
  waypoints: Array<{
    index: number;
    order: number;
    reason: string;
  }>;
}

interface RouteOptimizerProps {
  locations: Location[];
  startPoint?: { latitude: number; longitude: number };
  onOptimized?: (optimization: RouteOptimization) => void;
}

export const RouteOptimizer = ({ locations, startPoint, onOptimized }: RouteOptimizerProps) => {
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<RouteOptimization | null>(null);
  const { toast } = useToast();

  const optimizeRoute = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-route", {
        body: { locations, startPoint },
      });

      if (error) throw error;

      setOptimization(data);
      onOptimized?.(data);

      toast({
        title: "Route optimized!",
        description: `${data.estimatedDistance} in ${data.estimatedTime}`,
      });
    } catch (error: any) {
      console.error("Route optimization error:", error);
      toast({
        title: "Optimization failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Route Optimization</h3>
        </div>
        <Button
          onClick={optimizeRoute}
          disabled={optimizing || locations.length < 2}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {optimizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4" />
              Optimize
            </>
          )}
        </Button>
      </div>

      {locations.length < 2 && (
        <p className="text-sm text-muted-foreground">
          Select at least 2 locations to optimize route
        </p>
      )}

      {optimization && (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{optimization.estimatedDistance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">{optimization.estimatedTime}</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{optimization.reasoning}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Optimized Route:</p>
            <div className="space-y-2">
              {optimization.waypoints.map((waypoint, idx) => {
                const location = locations[waypoint.index];
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-secondary/50 rounded"
                  >
                    <Badge variant="outline" className="mt-0.5">
                      {idx + 1}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{location.title}</p>
                      <p className="text-xs text-muted-foreground">{waypoint.reason}</p>
                    </div>
                    {location.priority === "high" && (
                      <Badge variant="destructive" className="text-xs">
                        High Priority
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
