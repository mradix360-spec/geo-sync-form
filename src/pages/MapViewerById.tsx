import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Map as MapIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";
import { Card } from "@/components/ui/card";
import { SymbolType, SymbolSize } from "@/lib/mapSymbols";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

const BASEMAPS = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  },
  {
    id: 'topo',
    name: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap'
  },
  {
    id: 'dark',
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO'
  },
  {
    id: 'light',
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO'
  },
];

interface MapConfig {
  title: string;
  description: string;
  config: {
    basemap: {
      name: string;
      url: string;
      attribution: string;
    };
    layers: Array<{
      id: string;
      formId: string;
      name: string;
      visible: boolean;
      color: string;
    }>;
    viewport: {
      center: [number, number];
      zoom: number;
    };
  };
}

const MapViewerById = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) {
      navigate(-1);
      return;
    }
    loadMap();
  }, [id]);

  const loadMap = async () => {
    try {
      setLoading(true);

      const { data: mapData, error: mapError } = await supabase
        .from('maps')
        .select('*')
        .eq('id', id)
        .single();

      if (mapError) throw mapError;

      const config = mapData.config as any;
      
      // Convert basemap ID to full basemap object
      let basemapConfig = BASEMAPS[0]; // default to OSM
      if (config.basemap) {
        const foundBasemap = BASEMAPS.find(b => b.id === config.basemap);
        if (foundBasemap) {
          basemapConfig = foundBasemap;
        }
      }
      
      setMapConfig({
        title: mapData.title,
        description: mapData.description,
        config: {
          ...config,
          basemap: basemapConfig
        },
      });

      // Initialize visible layers from config
      const initialVisible = new Set<string>(
        config.layers?.filter((l: any) => l.visible).map((l: any) => l.id as string) || []
      );
      setVisibleLayers(initialVisible);

      // Load responses for all layers
      const allLayers = config.layers || [];
      const formIds = allLayers.map((l: any) => l.formId);

      if (formIds.length > 0) {
        const { data: responseData, error: responseError } = await supabase
          .from('form_responses')
          .select('*')
          .in('form_id', formIds);

        if (responseError) throw responseError;
        
        // Map responses with their layer configuration
        const mappedResponses = (responseData || []).map((r: any) => {
          const layer = allLayers.find((l: any) => l.formId === r.form_id);
          return {
            geojson: r.geojson,
            symbolType: layer?.symbolType || 'circle' as SymbolType,
            symbolSize: layer?.symbolSize || 'medium' as SymbolSize,
            color: layer?.color || '#3b82f6',
            layerId: layer?.id,
          };
        });
        
        setResponses(mappedResponses);
      }
    } catch (error: any) {
      console.error('Error loading map:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load map',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLayer = (layerId: string) => {
    setVisibleLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  // Filter responses by visible layers
  const visibleResponses = responses.filter(r => 
    r.layerId && visibleLayers.has(r.layerId)
  );

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <header className="bg-card border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </header>
        <div className="flex-1 bg-muted/20 relative">
          <Skeleton className="absolute inset-0" />
        </div>
      </div>
    );
  }

  if (!mapConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="p-8 max-w-md w-full">
          <EmptyState
            icon={MapIcon}
            title="Map Not Found"
            description="This map is not available or may have been deleted."
            actionLabel="Go Back"
            onAction={() => navigate(-1)}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card border-b p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{mapConfig.title}</h1>
            {mapConfig.description && (
              <p className="text-sm text-muted-foreground mt-1">{mapConfig.description}</p>
            )}
          </div>
        </div>
        <Button
          onClick={() => navigate(`/map-builder/${id}`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Map
        </Button>
      </header>
      
      <div className="flex-1">
        <MapView
          responses={visibleResponses}
          basemapUrl={mapConfig.config.basemap.url}
          basemapAttribution={mapConfig.config.basemap.attribution}
          layers={mapConfig.config.layers?.map(l => ({
            id: l.id,
            formTitle: l.name,
            visible: visibleLayers.has(l.id),
            color: l.color,
          })) || []}
          onToggleLayer={handleToggleLayer}
          showControls={true}
        />
      </div>
    </div>
  );
};

export default MapViewerById;
