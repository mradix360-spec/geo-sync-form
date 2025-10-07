import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Trash2 } from "lucide-react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";

export const SpatialFilterWidget = () => {
  const { filters, removeSpatialFilter, clearSpatialFilters } = useDashboardFilters();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Spatial Filters</CardTitle>
          </div>
          {filters.spatialFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSpatialFilters}
              className="h-7"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filters.spatialFilters.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>No spatial filters active</p>
            <p className="text-xs mt-1">Interact with map to add filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filters.spatialFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="secondary" className="text-xs">
                    {filter.type.toUpperCase()}
                  </Badge>
                  {filter.formId && (
                    <span className="text-xs text-muted-foreground truncate">
                      Form: {filter.formId.slice(0, 8)}...
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSpatialFilter(index)}
                  className="h-7 w-7 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {filters.selectedFeatures.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Selected Features: {filters.selectedFeatures.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {filters.selectedFeatures.slice(0, 5).map((id, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {id.slice(0, 6)}
                </Badge>
              ))}
              {filters.selectedFeatures.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{filters.selectedFeatures.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
