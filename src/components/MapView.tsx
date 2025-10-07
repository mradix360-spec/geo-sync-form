import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  responses?: any[];
  basemapUrl?: string;
  basemapAttribution?: string;
}

const MapView = ({ responses = [], basemapUrl, basemapAttribution }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map once
  useEffect(() => {
    try {
      if (containerRef.current && !mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [0, 0],
          zoom: 2,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        const defaultUrl = basemapUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const defaultAttribution = basemapAttribution || '&copy; OpenStreetMap contributors';

        tileLayerRef.current = L.tileLayer(defaultUrl, {
          attribution: defaultAttribution,
        }).addTo(mapRef.current);

        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }

    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markersLayerRef.current = null;
          tileLayerRef.current = null;
        }
      } catch (cleanupErr) {
        console.warn('Error cleaning up Leaflet map:', cleanupErr);
      }
    };
  }, []);

  // Update basemap when URL changes
  useEffect(() => {
    try {
      const map = mapRef.current;
      const oldTileLayer = tileLayerRef.current;
      if (!map || !basemapUrl) return;

      // Remove old tile layer
      if (oldTileLayer) {
        map.removeLayer(oldTileLayer);
      }

      // Add new tile layer
      const newAttribution = basemapAttribution || '&copy; OpenStreetMap contributors';
      tileLayerRef.current = L.tileLayer(basemapUrl, {
        attribution: newAttribution,
      }).addTo(map);
    } catch (err) {
      console.error('Error updating basemap:', err);
    }
  }, [basemapUrl, basemapAttribution]);

  // Update markers when responses change
  useEffect(() => {
    try {
      const map = mapRef.current;
      const layer = markersLayerRef.current;
      if (!map || !layer) return;

      // Clear existing markers
      layer.clearLayers();

      const validCoords: [number, number][] = [];

      (responses || []).forEach((r, index) => {
        const coords = r?.geojson?.geometry?.coordinates;
        if (
          Array.isArray(coords) &&
          coords.length >= 2 &&
          typeof coords[0] === 'number' &&
          typeof coords[1] === 'number'
        ) {
          const latlng: [number, number] = [coords[1], coords[0]]; // [lat, lng]
          validCoords.push(latlng);

          const props = r?.geojson?.properties || {};
          const popupHtml = `
            <div class="text-sm">
              <strong>Response #${index + 1}</strong>
              ${
                Object.keys(props).length
                  ? `<div class="mt-2 space-y-1">${Object.entries(props)
                      .map(([k, v]) => `<div><span class="font-medium">${k}:</span> ${String(v)}</div>`) 
                      .join('')}</div>`
                  : ''
              }
            </div>`;

          L.marker(latlng, { icon: DefaultIcon }).addTo(layer).bindPopup(popupHtml);
        }
      });

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([0, 0], 2);
      }
    } catch (err) {
      console.error('Error updating Leaflet markers:', err);
    }
  }, [responses]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default MapView;

