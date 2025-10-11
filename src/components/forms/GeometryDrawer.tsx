import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Navigation, Pencil, MapPin, Trash2, Play, Square } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LocationAccuracy } from '@/components/shared/LocationAccuracy';

interface GeometryDrawerProps {
  geometryType: 'point' | 'linestring' | 'polygon';
  initialValue?: any;
  onChange: (geojson: any) => void;
  inputMethod?: 'sketch' | 'vertex';
}

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GeometryInfo = ({ geometry }: { geometry: any }) => {
  if (!geometry) return null;

  const calculateStats = () => {
    if (geometry.type === 'Point') {
      return null;
    }

    if (geometry.type === 'LineString') {
      const coords = geometry.coordinates as [number, number][];
      let length = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = L.latLng(coords[i][1], coords[i][0]);
        const p2 = L.latLng(coords[i + 1][1], coords[i + 1][0]);
        length += p1.distanceTo(p2);
      }
      return {
        length: length > 1000 ? `${(length / 1000).toFixed(2)} km` : `${length.toFixed(2)} m`,
        vertices: coords.length
      };
    }

    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0] as [number, number][];
      
      // Calculate area using shoelace formula (planar approximation)
      // For more accuracy, use geodesic calculations
      let area = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1]);
      }
      area = Math.abs(area / 2);
      // Convert to approximate square meters (rough conversion at equator)
      area = area * 111000 * 111000;
      
      // Calculate perimeter
      let perimeter = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = L.latLng(coords[i][1], coords[i][0]);
        const p2 = L.latLng(coords[i + 1][1], coords[i + 1][0]);
        perimeter += p1.distanceTo(p2);
      }

      return {
        area: area > 10000 
          ? `${(area / 10000).toFixed(2)} ha` 
          : `${area.toFixed(2)} m²`,
        perimeter: perimeter > 1000 
          ? `${(perimeter / 1000).toFixed(2)} km` 
          : `${perimeter.toFixed(2)} m`,
        vertices: coords.length - 1
      };
    }

    return null;
  };

  const stats = calculateStats();
  if (!stats) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {stats.area && (
        <Badge variant="secondary">Area: {stats.area}</Badge>
      )}
      {stats.length && (
        <Badge variant="secondary">Length: {stats.length}</Badge>
      )}
      {stats.perimeter && (
        <Badge variant="secondary">Perimeter: {stats.perimeter}</Badge>
      )}
      <Badge variant="outline">Vertices: {stats.vertices}</Badge>
    </div>
  );
};

const GPSStreamingControl = ({ 
  onPoint, 
  isStreaming, 
  onToggleStreaming 
}: { 
  onPoint: (lat: number, lng: number, accuracy?: number) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
}) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStreaming) {
      // Start GPS streaming
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setCurrentLocation(location);
          onPoint(location.lat, location.lng, location.accuracy);
        },
        (error) => {
          toast({
            variant: 'destructive',
            title: 'GPS Error',
            description: error.message
          });
          onToggleStreaming();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    } else {
      // Stop GPS streaming
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isStreaming]);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={isStreaming ? 'destructive' : 'default'}
        onClick={onToggleStreaming}
      >
        {isStreaming ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
        {isStreaming ? 'Stop' : 'Stream GPS'}
      </Button>
      {currentLocation && (
        <LocationAccuracy accuracy={currentLocation.accuracy} />
      )}
    </div>
  );
};

const MapController = ({ 
  center, 
  zoom, 
  geometryType,
  inputMethod,
  onCreated,
  onEdited,
  onDeleted,
  initialGeometry
}: any) => {
  const map = useMap();
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  useEffect(() => {
    // Load initial geometry if provided
    if (initialGeometry && featureGroupRef.current) {
      const layer = L.geoJSON(initialGeometry);
      layer.eachLayer((l) => {
        featureGroupRef.current?.addLayer(l);
      });
    }
  }, [initialGeometry]);

  const handleGPSPoint = (lat: number, lng: number) => {
    if (!featureGroupRef.current) return;

    if (geometryType === 'point') {
      // Replace existing marker
      featureGroupRef.current.clearLayers();
      const marker = L.marker([lat, lng]);
      featureGroupRef.current.addLayer(marker);
      
      const geojson = {
        type: 'Point',
        coordinates: [lng, lat]
      };
      onCreated({ layer: marker, layerType: 'marker' }, geojson);
    } else if (geometryType === 'linestring' && isStreaming) {
      // Add point to streaming line
      if (!streamingLayerRef.current) {
        streamingLayerRef.current = L.polyline([[lat, lng]], { color: '#3b82f6', weight: 3 });
        featureGroupRef.current.addLayer(streamingLayerRef.current);
      } else {
        streamingLayerRef.current.addLatLng([lat, lng]);
      }
      
      // Update geojson
      const latlngs = streamingLayerRef.current.getLatLngs() as L.LatLng[];
      const geojson = {
        type: 'LineString',
        coordinates: latlngs.map(ll => [ll.lng, ll.lat])
      };
      onCreated({ layer: streamingLayerRef.current, layerType: 'polyline' }, geojson);
    }
  };

  const toggleStreaming = () => {
    if (isStreaming && streamingLayerRef.current) {
      streamingLayerRef.current = null;
    }
    setIsStreaming(!isStreaming);
  };

  const handleAddVertex = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'GPS not available',
        description: 'Geolocation is not supported by your device'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleGPSPoint(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'GPS Error',
          description: error.message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <>
      <FeatureGroup ref={featureGroupRef}>
        {inputMethod === 'sketch' && (
          <EditControl
            position="topright"
            onCreated={(e) => {
              const layer = e.layer;
              let geojson: any = null;

              if (geometryType === 'point' && e.layerType === 'marker') {
                const latlng = (layer as L.Marker).getLatLng();
                geojson = {
                  type: 'Point',
                  coordinates: [latlng.lng, latlng.lat]
                };
              } else if (geometryType === 'linestring' && e.layerType === 'polyline') {
                const latlngs = (layer as L.Polyline).getLatLngs() as L.LatLng[];
                geojson = {
                  type: 'LineString',
                  coordinates: latlngs.map(ll => [ll.lng, ll.lat])
                };
              } else if (geometryType === 'polygon' && e.layerType === 'polygon') {
                const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
                geojson = {
                  type: 'Polygon',
                  coordinates: [latlngs.map(ll => [ll.lng, ll.lat]).concat([[latlngs[0].lng, latlngs[0].lat]])]
                };
              }

              onCreated(e, geojson);
            }}
            onEdited={onEdited}
            onDeleted={onDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: geometryType === 'point',
              polyline: geometryType === 'linestring' ? {
                shapeOptions: {
                  color: '#3b82f6',
                  weight: 3
                }
              } : false,
              polygon: geometryType === 'polygon' ? {
                shapeOptions: {
                  color: '#3b82f6',
                  fillOpacity: 0.3
                }
              } : false
            }}
          />
        )}
      </FeatureGroup>

      {/* Vertex mode controls */}
      {inputMethod === 'vertex' && (
        <div className="leaflet-top leaflet-right" style={{ marginTop: '80px', marginRight: '10px' }}>
          <Card className="p-3 space-y-2">
            {geometryType === 'linestring' && (
              <GPSStreamingControl 
                onPoint={handleGPSPoint}
                isStreaming={isStreaming}
                onToggleStreaming={toggleStreaming}
              />
            )}
            {!isStreaming && (
              <Button
                type="button"
                size="sm"
                onClick={handleAddVertex}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Add GPS Point
              </Button>
            )}
            {featureGroupRef.current && featureGroupRef.current.getLayers().length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  featureGroupRef.current?.clearLayers();
                  streamingLayerRef.current = null;
                  onDeleted();
                }}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export const GeometryDrawer = ({ 
  geometryType, 
  initialValue, 
  onChange,
  inputMethod = 'sketch'
}: GeometryDrawerProps) => {
  const [center, setCenter] = useState<[number, number]>([-6.7924, 39.2083]); // Dar es Salaam
  const [zoom, setZoom] = useState(13);
  const [currentGeometry, setCurrentGeometry] = useState<any>(initialValue);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Fallback to default location
        }
      );
    }
  }, []);

  const handleCreated = (e: any, geojson: any) => {
    setCurrentGeometry(geojson);
    onChange(geojson);
  };

  const handleEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      let geojson: any = null;

      if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        geojson = {
          type: 'Point',
          coordinates: [latlng.lng, latlng.lat]
        };
      } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        const latlngs = layer.getLatLngs() as L.LatLng[];
        geojson = {
          type: 'LineString',
          coordinates: latlngs.map(ll => [ll.lng, ll.lat])
        };
      } else if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        geojson = {
          type: 'Polygon',
          coordinates: [latlngs.map(ll => [ll.lng, ll.lat]).concat([[latlngs[0].lng, latlngs[0].lat]])]
        };
      }

      if (geojson) {
        setCurrentGeometry(geojson);
        onChange(geojson);
      }
    });
  };

  const handleDeleted = () => {
    setCurrentGeometry(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {inputMethod === 'sketch' ? <Pencil className="w-3 h-3 mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
            {inputMethod === 'sketch' ? 'Sketch Mode' : 'Vertex Mode'}
          </Badge>
          <Badge variant="secondary">
            {geometryType === 'point' ? 'Point' : geometryType === 'linestring' ? 'Line' : 'Polygon'}
          </Badge>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController
            center={center}
            zoom={zoom}
            geometryType={geometryType}
            inputMethod={inputMethod}
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            initialGeometry={initialValue}
          />
        </MapContainer>
      </div>

      <GeometryInfo geometry={currentGeometry} />
      
      {inputMethod === 'sketch' && (
        <p className="text-xs text-muted-foreground">
          Use the drawing tools on the map to {geometryType === 'point' ? 'place a marker' : geometryType === 'linestring' ? 'draw a line' : 'draw a polygon'}. You can edit or delete after drawing.
        </p>
      )}
      {inputMethod === 'vertex' && (
        <p className="text-xs text-muted-foreground">
          Use the GPS button to add vertices from your current location. {geometryType === 'linestring' && 'Use Stream GPS for continuous tracking while walking.'}
        </p>
      )}
    </div>
  );
};
