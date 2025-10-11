import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
// Note: Leaflet expects absolute/relative URLs; using CDN to avoid bundler asset issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GeometryInfo = ({ geometry }: { geometry: any }) => {
  if (!geometry) return null;

  const calculateStats = () => {
    if (geometry.type === 'Point') return null;

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
        vertices: coords.length,
      } as any;
    }

    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0] as [number, number][];
      let area = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
      }
      area = Math.abs(area / 2) * 111000 * 111000;

      let perimeter = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = L.latLng(coords[i][1], coords[i][0]);
        const p2 = L.latLng(coords[i + 1][1], coords[i + 1][0]);
        perimeter += p1.distanceTo(p2);
      }
      return {
        area: area > 10000 ? `${(area / 10000).toFixed(2)} ha` : `${area.toFixed(2)} m²`,
        perimeter: perimeter > 1000 ? `${(perimeter / 1000).toFixed(2)} km` : `${perimeter.toFixed(2)} m`,
        vertices: coords.length - 1,
      } as any;
    }

    return null;
  };

  const stats = calculateStats();
  if (!stats) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {stats.area && <Badge variant="secondary">Area: {stats.area}</Badge>}
      {stats.length && <Badge variant="secondary">Length: {stats.length}</Badge>}
      {stats.perimeter && <Badge variant="secondary">Perimeter: {stats.perimeter}</Badge>}
      <Badge variant="outline">Vertices: {stats.vertices}</Badge>
    </div>
  );
};

const DrawingControls = ({
  geometryType,
  inputMethod,
  onAddPoint,
  onClear,
  onToggleStreaming,
  isStreaming,
  hasPoints,
  currentLocation,
}: any) => {
  return (
    <Card className="absolute top-4 right-4 p-3 space-y-2 z-[1000] bg-background">
      {inputMethod === 'vertex' ? (
        <>
          {geometryType === 'linestring' && (
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant={isStreaming ? 'destructive' : 'default'} onClick={onToggleStreaming}>
                {isStreaming ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isStreaming ? 'Stop' : 'Stream GPS'}
              </Button>
              {currentLocation && <LocationAccuracy accuracy={currentLocation.accuracy} />}
            </div>
          )}
          {!isStreaming && (
            <Button type="button" size="sm" onClick={onAddPoint} className="w-full">
              <MapPin className="w-4 h-4 mr-1" />
              Add GPS Point
            </Button>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Click on the map to add points</p>
      )}
      {hasPoints && (
        <Button type="button" size="sm" variant="destructive" onClick={onClear} className="w-full">
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </Card>
  );
};

export const GeometryDrawer = ({
  geometryType,
  initialValue,
  onChange,
  inputMethod = 'vertex',
}: GeometryDrawerProps) => {
  const [center, setCenter] = useState<[number, number]>([-6.7924, 39.2083]);
  const [zoom] = useState(13);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ marker?: L.Marker; polyline?: L.Polyline; polygon?: L.Polygon }>({});

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: center as any,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    // Sketch mode: click to add points
    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (inputMethod === 'sketch') {
        handleAddPoint(e.latlng.lat, e.latlng.lng);
      }
    };
    mapRef.current.on('click', clickHandler);

    return () => {
      mapRef.current?.off('click', clickHandler);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adjust view when center changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center as any, zoom);
    }
  }, [center, zoom]);

  // Load initial value and user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter([position.coords.latitude, position.coords.longitude]),
        () => {}
      );
    }

    if (initialValue) {
      if (initialValue.type === 'Point') {
        const [lng, lat] = initialValue.coordinates;
        setMarkerPosition([lat, lng]);
      } else if (initialValue.type === 'LineString') {
        setPoints(initialValue.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]));
      } else if (initialValue.type === 'Polygon') {
        setPoints(initialValue.coordinates[0].map((c: number[]) => [c[1], c[0]] as [number, number]));
      }
    }
  }, [initialValue]);

  // GPS streaming
  useEffect(() => {
    if (isStreaming) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCurrentLocation(location);
          handleAddPoint(location.lat, location.lng);
        },
        (error) => {
          toast({ variant: 'destructive', title: 'GPS Error', description: error.message });
          setIsStreaming(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isStreaming]);

  const handleAddPoint = (lat: number, lng: number) => {
    if (geometryType === 'point') {
      setMarkerPosition([lat, lng]);
      onChange({ type: 'Point', coordinates: [lng, lat] });
    } else if (geometryType === 'linestring') {
      const newPoints = [...points, [lat, lng] as [number, number]];
      setPoints(newPoints);
      onChange({ type: 'LineString', coordinates: newPoints.map((p) => [p[1], p[0]]) });
    } else if (geometryType === 'polygon') {
      const newPoints = [...points, [lat, lng] as [number, number]];
      setPoints(newPoints);
      if (newPoints.length >= 3) {
        onChange({
          type: 'Polygon',
          coordinates: [newPoints.map((p) => [p[1], p[0]]).concat([[newPoints[0][1], newPoints[0][0]]])],
        });
      }
    }
  };

  // Render overlays on the Leaflet map when state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Color from design tokens (HSL vars)
    const color = 'hsl(var(--primary))';

    // Clear existing layers for current geometry type
    if (geometryType === 'point') {
      if (layersRef.current.polyline) {
        map.removeLayer(layersRef.current.polyline);
        layersRef.current.polyline = undefined;
      }
      if (layersRef.current.polygon) {
        map.removeLayer(layersRef.current.polygon);
        layersRef.current.polygon = undefined;
      }

      if (markerPosition) {
        if (layersRef.current.marker) {
          layersRef.current.marker.setLatLng(markerPosition as any);
        } else {
          layersRef.current.marker = L.marker(markerPosition as any).addTo(map);
        }
        map.panTo(markerPosition as any);
      } else if (layersRef.current.marker) {
        map.removeLayer(layersRef.current.marker);
        layersRef.current.marker = undefined;
      }
    }

    if (geometryType === 'linestring') {
      if (layersRef.current.marker) {
        map.removeLayer(layersRef.current.marker);
        layersRef.current.marker = undefined;
      }
      if (layersRef.current.polygon) {
        map.removeLayer(layersRef.current.polygon);
        layersRef.current.polygon = undefined;
      }

      if (points.length > 0) {
        if (layersRef.current.polyline) {
          layersRef.current.polyline.setLatLngs(points as any);
        } else {
          layersRef.current.polyline = L.polyline(points as any, { color, weight: 3 }).addTo(map);
        }
        map.fitBounds(layersRef.current.polyline.getBounds(), { padding: [20, 20] });
      } else if (layersRef.current.polyline) {
        map.removeLayer(layersRef.current.polyline);
        layersRef.current.polyline = undefined;
      }
    }

    if (geometryType === 'polygon') {
      if (layersRef.current.marker) {
        map.removeLayer(layersRef.current.marker);
        layersRef.current.marker = undefined;
      }
      if (layersRef.current.polyline) {
        map.removeLayer(layersRef.current.polyline);
        layersRef.current.polyline = undefined;
      }

      if (points.length > 0) {
        const latlngs = points as any;
        if (layersRef.current.polygon) {
          layersRef.current.polygon.setLatLngs(latlngs);
        } else {
          layersRef.current.polygon = L.polygon(latlngs, { color, weight: 2, fillOpacity: 0.3 }).addTo(map);
        }
        map.fitBounds(layersRef.current.polygon.getBounds(), { padding: [20, 20] });
      } else if (layersRef.current.polygon) {
        map.removeLayer(layersRef.current.polygon);
        layersRef.current.polygon = undefined;
      }
    }
  }, [geometryType, markerPosition, points]);

  const handleGPSPoint = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'GPS not available' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => handleAddPoint(position.coords.latitude, position.coords.longitude),
      (error) => toast({ variant: 'destructive', title: 'GPS Error', description: error.message }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClear = () => {
    setPoints([]);
    setMarkerPosition(null);
    onChange(null);
  };

  const currentGeometry =
    markerPosition
      ? { type: 'Point', coordinates: [markerPosition[1], markerPosition[0]] }
      : points.length > 0
      ? geometryType === 'linestring'
        ? { type: 'LineString', coordinates: points.map((p) => [p[1], p[0]]) }
        : geometryType === 'polygon' && points.length >= 3
        ? { type: 'Polygon', coordinates: [points.map((p) => [p[1], p[0]]).concat([[points[0][1], points[0][0]]])] }
        : null
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {inputMethod === 'sketch' ? <Pencil className="w-3 h-3 mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
          {inputMethod === 'sketch' ? 'Sketch Mode' : 'Vertex Mode'}
        </Badge>
        <Badge variant="secondary">{geometryType === 'point' ? 'Point' : geometryType === 'linestring' ? 'Line' : 'Polygon'}</Badge>
      </div>

      <div className="border rounded-lg overflow-hidden relative" style={{ height: '400px' }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        <DrawingControls
          geometryType={geometryType}
          inputMethod={inputMethod}
          onAddPoint={handleGPSPoint}
          onClear={handleClear}
          onToggleStreaming={() => setIsStreaming(!isStreaming)}
          isStreaming={isStreaming}
          hasPoints={points.length > 0 || markerPosition !== null}
          currentLocation={currentLocation}
        />
      </div>

      <GeometryInfo geometry={currentGeometry} />

      {inputMethod === 'sketch' && (
        <p className="text-xs text-muted-foreground">
          Click on the map to add points. {geometryType === 'polygon' && 'Add at least 3 points to create a polygon.'}
        </p>
      )}
      {inputMethod === 'vertex' && (
        <p className="text-xs text-muted-foreground">
          Use GPS button to add vertices. {geometryType === 'linestring' && 'Use Stream GPS for continuous tracking.'}
        </p>
      )}
    </div>
  );
};
