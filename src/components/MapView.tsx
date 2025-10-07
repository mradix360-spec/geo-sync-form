import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from './ui/card';

interface MapViewProps {
  responses: any[];
  mapboxToken?: string;
}

const MapView = ({ responses, mapboxToken }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState(mapboxToken || '');

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 0],
      zoom: 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('load', () => {
      if (!map.current) return;

      // Add responses as GeoJSON source
      map.current.addSource('responses', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: responses.map(r => r.geojson)
        }
      });

      // Add point layer
      map.current.addLayer({
        id: 'response-points',
        type: 'circle',
        source: 'responses',
        paint: {
          'circle-radius': 8,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Fit bounds to show all points
      if (responses.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        responses.forEach(r => {
          if (r.geojson?.geometry?.coordinates) {
            bounds.extend(r.geojson.geometry.coordinates);
          }
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [responses, token]);

  if (!mapboxToken && !token) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground">
            Please enter your Mapbox public token to view the map. Get one at https://mapbox.com
          </p>
          <input
            type="text"
            placeholder="pk.your_mapbox_token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapView;
