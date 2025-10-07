import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";
import { Card } from "@/components/ui/card";

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
      setMapConfig({
        title: mapData.title,
        description: mapData.description,
        config,
      });

      // Load responses for all visible layers
      const visibleLayers = config.layers?.filter((l: any) => l.visible) || [];
      const formIds = visibleLayers.map((l: any) => l.formId);

      if (formIds.length > 0) {
        const { data: responseData, error: responseError } = await supabase
          .from('form_responses')
          .select('*')
          .in('form_id', formIds);

        if (responseError) throw responseError;
        setResponses(responseData || []);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!mapConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2">Map Not Found</h2>
          <p className="text-muted-foreground">This map is not available.</p>
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
          responses={responses}
          basemapUrl={mapConfig.config.basemap?.url}
          basemapAttribution={mapConfig.config.basemap?.attribution}
        />
      </div>
    </div>
  );
};

export default MapViewerById;
