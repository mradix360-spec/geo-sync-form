import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import MapView from '@/components/MapView';

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

export default function PublicMapViewer() {
  const { token } = useParams();
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMap();
  }, [token]);

  const loadMap = async () => {
    try {
      setLoading(true);

      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('object_id')
        .eq('token', token)
        .eq('access_type', 'public')
        .eq('object_type', 'map')
        .maybeSingle();

      if (shareError || !share) {
        throw new Error('Invalid or expired share link');
      }

      const { data: mapData, error: mapError } = await supabase
        .from('maps')
        .select('*')
        .eq('id', share.object_id)
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
      <header className="bg-card border-b p-4">
        <h1 className="text-2xl font-bold">{mapConfig.title}</h1>
        {mapConfig.description && (
          <p className="text-sm text-muted-foreground mt-1">{mapConfig.description}</p>
        )}
      </header>
      
      <div className="flex-1">
        <MapView
          responses={responses}
          basemapUrl={mapConfig.config.basemap.url}
          basemapAttribution={mapConfig.config.basemap.attribution}
        />
      </div>
    </div>
  );
}
