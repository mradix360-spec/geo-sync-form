import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
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
      let area = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1]);
      }
      area = Math.abs(area / 2);
      // Convert to approximate square meters (rough conversion)
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
  geometryType,
  inputMethod,
  onGeometryChange,
  initialGeometry
}: any) => {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // Load initial geometry if provided
    if (initialGeometry) {
      const layer = L.geoJSON(initialGeometry);
      layer.eachLayer((l) => {
        drawnItems.addLayer(l);
      });
    }

    // Setup draw control for sketch mode
    if (inputMethod === 'sketch') {
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems
        },
        draw: {
          marker: geometryType === 'point' ? {} : false,
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
          } : false,
          circle: false,
          rectangle: false,
          circlemarker: false
        }
      });
      
      map.addControl(drawControl);
      drawControlRef.current = drawControl;
    }

    // Event handlers
    const handleCreated = (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
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
      
      onGeometryChange(geojson);
    };

    const handleEdited = (e: any) => {
      e.layers.eachLayer((layer: any) => {
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
          onGeometryChange(geojson);
        }
      });
    };

    const handleDeleted = () => {
      onGeometryChange(null);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      map.removeLayer(drawnItems);
    };
  }, [map, geometryType, inputMethod]);

  const handleGPSPoint = (lat: number, lng: number) => {
    const drawnItems = drawnItemsRef.current;

    if (geometryType === 'point') {
      drawnItems.clearLayers();
      const marker = L.marker([lat, lng]);
      drawnItems.addLayer(marker);
      
      const geojson = {
        type: 'Point',
        coordinates: [lng, lat]
      };
      onGeometryChange(geojson);
    } else if (geometryType === 'linestring' && isStreaming) {
      if (!streamingLayerRef.current) {
        streamingLayerRef.current = L.polyline([[lat, lng]], { color: '#3b82f6', weight: 3 });
        drawnItems.addLayer(streamingLayerRef.current);
      } else {
        streamingLayerRef.current.addLatLng([lat, lng]);
      }
      
      const latlngs = streamingLayerRef.current.getLatLngs() as L.LatLng[];
      const geojson = {
        type: 'LineString',
        coordinates: latlngs.map(ll => [ll.lng, ll.lat])
      };
      onGeometryChange(geojson);
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

  const handleClear = () => {
    drawnItemsRef.current.clearLayers();
    streamingLayerRef.current = null;
    onGeometryChange(null);
  };

  return (
    <>
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
            {drawnItemsRef.current && drawnItemsRef.current.getLayers().length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleClear}
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
  const [center, setCenter] = useState<[number, number]>([-6.7924, 39.2083]);
  const [zoom, setZoom] = useState(13);
  const [currentGeometry, setCurrentGeometry] = useState<any>(initialValue);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  const handleGeometryChange = (geojson: any) => {
    setCurrentGeometry(geojson);
    onChange(geojson);
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
            geometryType={geometryType}
            inputMethod={inputMethod}
            onGeometryChange={handleGeometryChange}
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
