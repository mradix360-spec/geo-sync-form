import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MapView from '@/components/MapView';

export default function EmbedMapViewer() {
  const { token } = useParams();
  const [responses, setResponses] = useState<any[]>([]);
  const [basemap, setBasemap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMap();
  }, [token]);

  const loadMap = async () => {
    try {
      const { data: share } = await supabase
        .from('shares')
        .select('object_id')
        .eq('token', token)
        .eq('access_type', 'public')
        .eq('object_type', 'map')
        .maybeSingle();

      if (!share) return;

      const { data: mapData } = await supabase
        .from('maps')
        .select('*')
        .eq('id', share.object_id)
        .single();

      if (!mapData) return;

      const config = mapData.config as any;
      setBasemap(config.basemap);

      const visibleLayers = config.layers?.filter((l: any) => l.visible) || [];
      const formIds = visibleLayers.map((l: any) => l.formId);

      if (formIds.length > 0) {
        const { data: responseData } = await supabase
          .from('form_responses')
          .select('*')
          .in('form_id', formIds);

        setResponses(responseData || []);
      }
    } catch (error) {
      console.error('Error loading map:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <MapView
        responses={responses}
        basemapUrl={basemap?.url}
        basemapAttribution={basemap?.attribution}
      />
    </div>
  );
}
