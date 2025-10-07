import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { createCustomIcon, SymbolType, SymbolSize } from '@/lib/mapSymbols';

interface StyleRule {
  field: string;
  symbologyType?: 'single' | 'unique' | 'categorical';
  values: { value: string; color: string }[];
}

interface ResponseWithSymbol {
  geojson: any;
  symbolType?: SymbolType;
  symbolSize?: SymbolSize;
  color?: string;
  styleRule?: StyleRule;
  layerTitle?: string;
}

interface MapViewProps {
  responses?: ResponseWithSymbol[];
  basemapUrl?: string;
  basemapAttribution?: string;
  enableClustering?: boolean;
}

const MapView = ({ responses = [], basemapUrl, basemapAttribution, enableClustering = true }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map once
  useEffect(() => {
    try {
      if (containerRef.current && !mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [0, 20],
          zoom: 3,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        const defaultUrl = basemapUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const defaultAttribution = basemapAttribution || '&copy; OpenStreetMap contributors';

        tileLayerRef.current = L.tileLayer(defaultUrl, {
          attribution: defaultAttribution,
        }).addTo(mapRef.current);

        // Add scale control
        L.control.scale({
          position: 'bottomleft',
          metric: true,
          imperial: false
        }).addTo(mapRef.current);

        // Add custom reset view control
        const ResetControl = L.Control.extend({
          options: { position: 'topleft' },
          onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button = L.DomUtil.create('a', '', container);
            button.innerHTML = '⌂';
            button.href = '#';
            button.title = 'Reset view to Africa';
            button.style.fontSize = '20px';
            button.style.lineHeight = '26px';
            button.style.width = '26px';
            button.style.height = '26px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            
            L.DomEvent.on(button, 'click', function(e) {
              L.DomEvent.preventDefault(e);
              if (mapRef.current) {
                mapRef.current.setView([0, 20], 3);
              }
            });
            
            return container;
          }
        });

        new ResetControl().addTo(mapRef.current);
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

  // Reinitialize markers layer when clustering changes
  useEffect(() => {
    try {
      const map = mapRef.current;
      if (!map) return;

      // Remove old layer
      if (markersLayerRef.current) {
        map.removeLayer(markersLayerRef.current);
      }

      // Create new layer based on clustering setting
      if (enableClustering) {
        markersLayerRef.current = (L as any).markerClusterGroup({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: true,
          zoomToBoundsOnClick: true,
        }).addTo(map);
      } else {
        markersLayerRef.current = L.layerGroup().addTo(map);
      }
    } catch (err) {
      console.error('Error reinitializing markers layer:', err);
    }
  }, [enableClustering]);

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
          
          // Create rich popup with all fields formatted
          const popupHtml = `
            <div class="min-w-[200px] max-w-[300px]">
              ${r.layerTitle ? `<div class="font-bold text-base mb-2 pb-2 border-b">${r.layerTitle}</div>` : ''}
              ${
                Object.keys(props).length
                  ? `<div class="space-y-2">${Object.entries(props)
                      .filter(([k]) => k !== 'id')
                      .map(([k, v]) => {
                        const displayValue = Array.isArray(v) 
                          ? v.join(', ') 
                          : typeof v === 'object' 
                            ? JSON.stringify(v) 
                            : String(v);
                        return `
                          <div class="text-sm">
                            <div class="font-semibold text-xs uppercase text-muted-foreground mb-0.5">${k}</div>
                            <div class="text-foreground">${displayValue}</div>
                          </div>
                        `;
                      })
                      .join('')}</div>`
                  : '<div class="text-sm text-muted-foreground">No data available</div>'
              }
            </div>`;

          // Determine marker color based on style rules or default
          let markerColor = r.color || '#3b82f6';
          if (r.styleRule) {
            if (r.styleRule.symbologyType === 'single') {
              // Single symbol - use the first color
              markerColor = r.styleRule.values[0]?.color || markerColor;
            } else if (props[r.styleRule.field]) {
              // Unique values - match field value
              const fieldValue = String(props[r.styleRule.field]);
              const matchingRule = r.styleRule.values.find(v => v.value === fieldValue);
              if (matchingRule) {
                markerColor = matchingRule.color;
              }
            }
          }

          const icon = createCustomIcon(
            r.symbolType || 'circle',
            markerColor,
            r.symbolSize || 'medium'
          );

          L.marker(latlng, { icon }).addTo(layer).bindPopup(popupHtml, {
            maxWidth: 300,
            className: 'custom-popup'
          });
        }
      });

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([0, 20], 3);
      }
    } catch (err) {
      console.error('Error updating Leaflet markers:', err);
    }
  }, [responses, enableClustering]);

  return (
    <div className="relative w-full h-full z-0">
      <div ref={containerRef} className="h-full w-full z-0" />
    </div>
  );
};

export default MapView;

