import { useState, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  coordinates: [number, number]; // [lat, lng]
  layerTitle: string;
  properties: Record<string, any>;
}

interface MapSearchBarProps {
  responses: Array<{
    geojson: any;
    layerTitle?: string;
  }>;
  onResultSelect: (coordinates: [number, number]) => void;
}

export const MapSearchBar = ({ responses, onResultSelect }: MapSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const foundResults: SearchResult[] = [];

    responses.forEach((response) => {
      const geojson = response.geojson as any;
      if (!geojson?.geometry?.coordinates || !geojson?.properties) return;

      const coords = geojson.geometry.coordinates;
      const props = geojson.properties;

      // Search through all properties
      const matchedFields: string[] = [];
      Object.entries(props).forEach(([key, value]) => {
        if (key.startsWith('_')) return; // Skip internal fields
        
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes(searchLower)) {
          matchedFields.push(`${key}: ${value}`);
        }
      });

      if (matchedFields.length > 0) {
        foundResults.push({
          id: props.id || Math.random().toString(),
          title: matchedFields[0] || 'Unnamed',
          subtitle: matchedFields.slice(1, 3).join(' • '),
          coordinates: [coords[1], coords[0]], // [lat, lng]
          layerTitle: response.layerTitle || 'Unknown Layer',
          properties: props,
        });
      }
    });

    setResults(foundResults.slice(0, 10)); // Limit to 10 results
    setShowResults(true);
  }, [searchTerm, responses]);

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result.coordinates);
    setShowResults(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-md px-4">
      <Card className="shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search locations or records..."
            className="pl-9 pr-9 border-0 focus-visible:ring-0"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="border-t">
            <ScrollArea className="max-h-[300px]">
              <div className="p-2 space-y-1">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 rounded hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.layerTitle}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {showResults && results.length === 0 && searchTerm.length >= 2 && (
          <div className="p-4 text-center text-sm text-muted-foreground border-t">
            No results found for "{searchTerm}"
          </div>
        )}
      </Card>
    </div>
  );
};
