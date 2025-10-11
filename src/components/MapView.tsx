import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { createCustomIcon, SymbolType, SymbolSize } from '@/lib/mapSymbols';
import { MapLayerControl } from '@/components/maps/MapLayerControl';
import { MapLegend } from '@/components/maps/MapLegend';
import { MapSearchBar } from '@/components/maps/MapSearchBar';
import { MapToolbar } from '@/components/maps/MapToolbar';
import { toast } from 'sonner';

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
  layerId?: string;
}

interface MapViewProps {
  responses?: ResponseWithSymbol[];
  basemapUrl?: string;
  basemapAttribution?: string;
  enableClustering?: boolean;
  layers?: Array<{
    id: string;
    formTitle: string;
    visible: boolean;
    color: string;
    symbolType?: SymbolType;
    styleRule?: StyleRule;
    responses?: any[];
  }>;
  onToggleLayer?: (layerId: string) => void;
  showControls?: boolean;
}

const MapView = ({ 
  responses = [], 
  basemapUrl, 
  basemapAttribution, 
  enableClustering = true,
  layers = [],
  onToggleLayer,
  showControls = false,
}: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const heatCirclesRef = useRef<L.CircleMarker[]>([]);
  const measurementLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [measurementActive, setMeasurementActive] = useState(false);
  const [drawingActive, setDrawingActive] = useState(false);

  // Handle search result selection
  const handleSearchResultSelect = (coordinates: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo(coordinates, 16, {
        duration: 1.5,
      });
    }
  };

  // Toggle heatmap (simple circle-based visualization)
  const handleToggleHeatmap = () => {
    const map = mapRef.current;
    if (!map) return;

    if (heatmapActive) {
      // Remove heatmap circles
      heatCirclesRef.current.forEach(circle => map.removeLayer(circle));
      heatCirclesRef.current = [];
      // Show markers
      if (markersLayerRef.current) {
        map.addLayer(markersLayerRef.current);
      }
      setHeatmapActive(false);
      toast.success('Heatmap disabled');
    } else {
      // Create density visualization with circles - only for Point geometries
      const circles: L.CircleMarker[] = [];
      responses.forEach((r) => {
        const geomType = r?.geojson?.geometry?.type;
        const coords = r?.geojson?.geometry?.coordinates;
        if (geomType === 'Point' && Array.isArray(coords) && coords.length >= 2) {
          const circle = L.circleMarker([coords[1], coords[0]], {
            radius: 15,
            fillColor: '#ff4444',
            fillOpacity: 0.4,
            stroke: false,
          });
          circle.addTo(map);
          circles.push(circle);
        }
      });

      if (circles.length > 0) {
        // Hide regular markers
        if (markersLayerRef.current) {
          map.removeLayer(markersLayerRef.current);
        }
        heatCirclesRef.current = circles;
        setHeatmapActive(true);
        toast.success('Density view enabled');
      } else {
        toast.error('No point data available for heatmap');
      }
    }
  };

  // Toggle measurement tools
  const handleToggleMeasurement = () => {
    const map = mapRef.current;
    if (!map) return;

    if (measurementActive) {
      // Clean up measurement layer
      if (measurementLayerRef.current) {
        map.removeLayer(measurementLayerRef.current);
        measurementLayerRef.current = null;
      }
      map.off('click');
      setMeasurementActive(false);
      toast.success('Measurement disabled');
    } else {
      // Initialize measurement layer
      measurementLayerRef.current = L.layerGroup().addTo(map);
      let points: L.LatLng[] = [];
      let polyline: L.Polyline | null = null;

      const clickHandler = (e: L.LeafletMouseEvent) => {
        points.push(e.latlng);
        
        const marker = L.circleMarker(e.latlng, {
          radius: 5,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          color: 'white',
          weight: 2,
        });
        
        if (measurementLayerRef.current) {
          marker.addTo(measurementLayerRef.current);
        }

        if (points.length > 1) {
          if (polyline && measurementLayerRef.current) {
            measurementLayerRef.current.removeLayer(polyline);
          }
          
          polyline = L.polyline(points, {
            color: '#3b82f6',
            weight: 3,
            dashArray: '5, 10',
          });
          
          if (measurementLayerRef.current) {
            polyline.addTo(measurementLayerRef.current);
          }

          const distance = points.reduce((total, point, i) => {
            if (i === 0) return 0;
            return total + points[i - 1].distanceTo(point);
          }, 0);

          const distanceKm = (distance / 1000).toFixed(2);
          toast.info(`Distance: ${distanceKm} km`);
        }
      };

      map.on('click', clickHandler);
      setMeasurementActive(true);
      toast.success('Click on map to measure. Click button again to stop.');
    }
  };

  // Toggle drawing tools (simple polygon/line drawing)
  const handleToggleDrawing = () => {
    const map = mapRef.current;
    if (!map) return;

    if (drawingActive) {
      // Clean up drawing layer
      if (drawingLayerRef.current) {
        map.removeLayer(drawingLayerRef.current);
        drawingLayerRef.current = null;
      }
      map.off('click');
      setDrawingActive(false);
      toast.success('Drawing disabled');
    } else {
      // Initialize drawing layer
      drawingLayerRef.current = L.layerGroup().addTo(map);
      let drawingPoints: L.LatLng[] = [];
      let tempLine: L.Polyline | null = null;

      const clickHandler = (e: L.LeafletMouseEvent) => {
        drawingPoints.push(e.latlng);
        
        const marker = L.circleMarker(e.latlng, {
          radius: 4,
          fillColor: '#22c55e',
          fillOpacity: 1,
          color: 'white',
          weight: 2,
        });
        
        if (drawingLayerRef.current) {
          marker.addTo(drawingLayerRef.current);
        }

        if (drawingPoints.length > 1) {
          if (tempLine && drawingLayerRef.current) {
            drawingLayerRef.current.removeLayer(tempLine);
          }
          
          tempLine = L.polyline(drawingPoints, {
            color: '#22c55e',
            weight: 2,
          });
          
          if (drawingLayerRef.current) {
            tempLine.addTo(drawingLayerRef.current);
          }
        }
      };

      const dblClickHandler = () => {
        if (drawingPoints.length > 2 && drawingLayerRef.current && tempLine) {
          // Convert to polygon on double click
          const polygon = L.polygon(drawingPoints, {
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.2,
            weight: 2,
          });
          
          drawingLayerRef.current.removeLayer(tempLine);
          polygon.addTo(drawingLayerRef.current);
          toast.success('Shape completed');
        }
        drawingPoints = [];
        tempLine = null;
      };

      map.on('click', clickHandler);
      map.on('dblclick', dblClickHandler);
      setDrawingActive(true);
      toast.success('Click to draw, double-click to finish shape');
    }
  };

  // Export map as image (using Leaflet's built-in screenshot via easyPrint)
  const handleExportMap = () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      toast.info('To save the map, use your browser\'s screenshot tool or print to PDF');
      
      // Trigger browser print dialog which can save as PDF
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Use browser screenshot (Ctrl+Shift+S) to capture the map');
    }
  };

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

        // Initialize vector layers for lines and polygons
        linesLayerRef.current = L.layerGroup().addTo(mapRef.current);
        polygonsLayerRef.current = L.layerGroup().addTo(mapRef.current);
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
          linesLayerRef.current = null;
          polygonsLayerRef.current = null;
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

  // Update markers and vector features when responses change
  useEffect(() => {
    try {
      const map = mapRef.current;
      const markersLayer = markersLayerRef.current;
      const linesLayer = linesLayerRef.current;
      const polygonsLayer = polygonsLayerRef.current;
      if (!map || !markersLayer || !linesLayer || !polygonsLayer) return;

      // Clear existing layers
      markersLayer.clearLayers();
      linesLayer.clearLayers();
      polygonsLayer.clearLayers();

      const bounds = L.latLngBounds([]);
      let hasBounds = false;

      // Helper: Convert [lng, lat] to [lat, lng]
      const toLngLat = (coords: number[]): [number, number] => [coords[1], coords[0]];

      (responses || []).forEach((r) => {
        const geometry = r?.geojson?.geometry;
        const props = r?.geojson?.properties || {};
        if (!geometry?.type || !geometry?.coordinates) return;

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

        // Determine color based on style rules or default
        let featureColor = r.color || '#3b82f6';
        if (r.styleRule) {
          if (r.styleRule.symbologyType === 'single') {
            featureColor = r.styleRule.values[0]?.color || featureColor;
          } else if (props[r.styleRule.field]) {
            const fieldValue = String(props[r.styleRule.field]);
            const matchingRule = r.styleRule.values.find(v => v.value === fieldValue);
            if (matchingRule) {
              featureColor = matchingRule.color;
            }
          }
        }

        // Process geometry by type
        switch (geometry.type) {
          case 'Point': {
            const coords = geometry.coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
              const latlng = toLngLat(coords);
              bounds.extend(latlng);
              hasBounds = true;

              const icon = createCustomIcon(
                r.symbolType || 'circle',
                featureColor,
                r.symbolSize || 'medium'
              );

              L.marker(latlng, { icon }).addTo(markersLayer).bindPopup(popupHtml, {
                maxWidth: 300,
                className: 'custom-popup'
              });
            }
            break;
          }

          case 'MultiPoint': {
            const coords = geometry.coordinates;
            if (Array.isArray(coords)) {
              coords.forEach((coord: number[]) => {
                if (Array.isArray(coord) && coord.length >= 2) {
                  const latlng = toLngLat(coord);
                  bounds.extend(latlng);
                  hasBounds = true;

                  const icon = createCustomIcon(
                    r.symbolType || 'circle',
                    featureColor,
                    r.symbolSize || 'medium'
                  );

                  L.marker(latlng, { icon }).addTo(markersLayer).bindPopup(popupHtml, {
                    maxWidth: 300,
                    className: 'custom-popup'
                  });
                }
              });
            }
            break;
          }

          case 'LineString': {
            const coords = geometry.coordinates;
            if (Array.isArray(coords) && coords.length > 0) {
              const latlngs = coords.map((c: number[]) => toLngLat(c));
              latlngs.forEach((ll: [number, number]) => {
                bounds.extend(ll);
                hasBounds = true;
              });

              L.polyline(latlngs, {
                color: featureColor,
                weight: 3,
                opacity: 0.8,
              }).addTo(linesLayer).bindPopup(popupHtml, {
                maxWidth: 300,
                className: 'custom-popup'
              });
            }
            break;
          }

          case 'MultiLineString': {
            const coords = geometry.coordinates;
            if (Array.isArray(coords)) {
              coords.forEach((line: number[][]) => {
                const latlngs = line.map((c: number[]) => toLngLat(c));
                latlngs.forEach((ll: [number, number]) => {
                  bounds.extend(ll);
                  hasBounds = true;
                });

                L.polyline(latlngs, {
                  color: featureColor,
                  weight: 3,
                  opacity: 0.8,
                }).addTo(linesLayer).bindPopup(popupHtml, {
                  maxWidth: 300,
                  className: 'custom-popup'
                });
              });
            }
            break;
          }

          case 'Polygon': {
            const coords = geometry.coordinates;
            if (Array.isArray(coords) && coords.length > 0) {
              const rings = coords.map((ring: number[][]) => 
                ring.map((c: number[]) => toLngLat(c))
              );
              
              rings[0]?.forEach((ll: [number, number]) => {
                bounds.extend(ll);
                hasBounds = true;
              });

              L.polygon(rings as any, {
                color: featureColor,
                fillColor: featureColor,
                fillOpacity: 0.2,
                weight: 2,
                opacity: 0.8,
              }).addTo(polygonsLayer).bindPopup(popupHtml, {
                maxWidth: 300,
                className: 'custom-popup'
              });
            }
            break;
          }

          case 'MultiPolygon': {
            const coords = geometry.coordinates;
            if (Array.isArray(coords)) {
              coords.forEach((polygon: number[][][]) => {
                const rings = polygon.map((ring: number[][]) => 
                  ring.map((c: number[]) => toLngLat(c))
                );
                
                rings[0]?.forEach((ll: [number, number]) => {
                  bounds.extend(ll);
                  hasBounds = true;
                });

                L.polygon(rings as any, {
                  color: featureColor,
                  fillColor: featureColor,
                  fillOpacity: 0.2,
                  weight: 2,
                  opacity: 0.8,
                }).addTo(polygonsLayer).bindPopup(popupHtml, {
                  maxWidth: 300,
                  className: 'custom-popup'
                });
              });
            }
            break;
          }
        }
      });

      // Fit map to all features
      if (hasBounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([0, 20], 3);
      }
    } catch (err) {
      console.error('Error updating map features:', err);
    }
  }, [responses, enableClustering]);

  return (
    <div className="relative w-full h-full z-0">
      <div ref={containerRef} className="h-full w-full z-0" />
      
      {showControls && (
        <>
          <MapToolbar
            onToggleHeatmap={handleToggleHeatmap}
            onToggleMeasurement={handleToggleMeasurement}
            onToggleDrawing={handleToggleDrawing}
            onExportMap={handleExportMap}
            heatmapActive={heatmapActive}
            measurementActive={measurementActive}
            drawingActive={drawingActive}
          />
          
          <MapLayerControl 
            layers={layers.map(l => ({
              id: l.id,
              formTitle: l.formTitle,
              visible: l.visible,
              color: l.color,
            }))}
            onToggleLayer={onToggleLayer || (() => {})}
          />
          
          <MapLegend layers={layers} />
          
          <MapSearchBar 
            responses={responses}
            onResultSelect={handleSearchResultSelect}
          />
        </>
      )}
    </div>
  );
};

export default MapView;

