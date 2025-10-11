import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Navigation, Pencil, MapPin, Trash2, Play, Square, Undo2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LocationAccuracy } from '@/components/shared/LocationAccuracy';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      {stats.area && <Badge variant="secondary" className="text-sm">Area: {stats.area}</Badge>}
      {stats.length && <Badge variant="secondary" className="text-sm">Length: {stats.length}</Badge>}
      {stats.perimeter && <Badge variant="secondary" className="text-sm">Perimeter: {stats.perimeter}</Badge>}
      <Badge variant="outline" className="text-sm">Vertices: {stats.vertices}</Badge>
    </div>
  );
};

const DrawingControls = ({
  geometryType,
  inputMethod,
  onAddPoint,
  onClear,
  onUndo,
  onToggleStreaming,
  isStreaming,
  hasPoints,
  currentLocation,
  canUndo,
}: any) => {
  const showAccuracyWarning = currentLocation && currentLocation.accuracy > 20;

  return (
    <Card className="absolute top-4 right-4 p-3 space-y-2 z-[1000] bg-background/95 backdrop-blur-sm shadow-lg">
      {inputMethod === 'vertex' ? (
        <>
          {showAccuracyWarning && (
            <Alert variant="destructive" className="p-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs ml-2">
                Low GPS accuracy ({currentLocation.accuracy.toFixed(0)}m)
              </AlertDescription>
            </Alert>
          )}
          {geometryType === 'linestring' && (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                variant={isStreaming ? 'destructive' : 'default'}
                onClick={onToggleStreaming}
                className="w-full"
              >
                {isStreaming ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isStreaming ? 'Stop Tracking' : 'Stream GPS'}
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
        <p className="text-xs text-muted-foreground">Click on map to add points</p>
      )}
      <div className="flex gap-2">
        {canUndo && (
          <Button type="button" size="sm" variant="outline" onClick={onUndo} className="flex-1">
            <Undo2 className="w-4 h-4 mr-1" />
            Undo
          </Button>
        )}
        {hasPoints && (
          <Button type="button" size="sm" variant="destructive" onClick={onClear} className="flex-1">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
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
  const [zoom] = useState(15);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    marker?: L.Marker;
    polyline?: L.Polyline;
    polygon?: L.Polygon;
    vertexMarkers?: L.CircleMarker[];
    currentPosMarker?: L.CircleMarker;
  }>({});

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
      maxZoom: 19,
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
    if (mapRef.current && center) {
      mapRef.current.setView(center as any, zoom);
    }
  }, [center, zoom]);

  // Load initial value and user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter([position.coords.latitude, position.coords.longitude]),
        (error) => console.warn('Geolocation error:', error)
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
          
          // Only add point if accuracy is reasonable (< 50m)
          if (location.accuracy < 50) {
            handleAddPoint(location.lat, location.lng);
          } else {
            toast({
              variant: 'destructive',
              title: 'GPS Accuracy Warning',
              description: `Accuracy: ${location.accuracy.toFixed(0)}m. Waiting for better signal...`,
            });
          }
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

  // Update current location marker when tracking
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    const map = mapRef.current;

    // Remove old current position marker
    if (layersRef.current.currentPosMarker) {
      map.removeLayer(layersRef.current.currentPosMarker);
    }

    // Add new current position marker (pulsing blue circle)
    layersRef.current.currentPosMarker = L.circleMarker([currentLocation.lat, currentLocation.lng], {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(map);

    // Add accuracy circle
    const accuracyCircle = L.circle([currentLocation.lat, currentLocation.lng], {
      radius: currentLocation.accuracy,
      fillColor: '#3b82f6',
      color: '#3b82f6',
      weight: 1,
      opacity: 0.3,
      fillOpacity: 0.1,
    }).addTo(map);

    return () => {
      accuracyCircle.remove();
    };
  }, [currentLocation]);

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

  const handleUndo = () => {
    if (points.length === 0) return;

    const newPoints = points.slice(0, -1);
    setPoints(newPoints);

    if (geometryType === 'linestring') {
      if (newPoints.length > 0) {
        onChange({ type: 'LineString', coordinates: newPoints.map((p) => [p[1], p[0]]) });
      } else {
        onChange(null);
      }
    } else if (geometryType === 'polygon') {
      if (newPoints.length >= 3) {
        onChange({
          type: 'Polygon',
          coordinates: [newPoints.map((p) => [p[1], p[0]]).concat([[newPoints[0][1], newPoints[0][0]]])],
        });
      } else {
        onChange(null);
      }
    }

    toast({ title: 'Point removed', description: 'Last vertex has been removed' });
  };

  // Render overlays on the Leaflet map when state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const primaryColor = '#3b82f6';

    // Clear vertex markers
    if (layersRef.current.vertexMarkers) {
      layersRef.current.vertexMarkers.forEach((marker) => map.removeLayer(marker));
      layersRef.current.vertexMarkers = [];
    }

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
          layersRef.current.polyline = L.polyline(points as any, { color: primaryColor, weight: 4 }).addTo(map);
        }

        // Add numbered vertex markers
        layersRef.current.vertexMarkers = points.map((point, index) => {
          const marker = L.circleMarker(point as any, {
            radius: 7,
            fillColor: '#fff',
            color: primaryColor,
            weight: 3,
            opacity: 1,
            fillOpacity: 1,
          }).addTo(map);

          // Add number label
          const icon = L.divIcon({
            className: 'vertex-label',
            html: `<div style="
              background: ${primaryColor};
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
            ">${index + 1}</div>`,
            iconSize: [20, 20],
          });

          L.marker(point as any, { icon }).addTo(map);

          return marker;
        });

        try {
          map.fitBounds(layersRef.current.polyline.getBounds(), { padding: [50, 50] });
        } catch (e) {
          // Ignore bounds error for single point
        }
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
          layersRef.current.polygon = L.polygon(latlngs, { color: primaryColor, weight: 3, fillOpacity: 0.2 }).addTo(map);
        }

        // Add numbered vertex markers
        layersRef.current.vertexMarkers = points.map((point, index) => {
          const marker = L.circleMarker(point as any, {
            radius: 7,
            fillColor: '#fff',
            color: primaryColor,
            weight: 3,
            opacity: 1,
            fillOpacity: 1,
          }).addTo(map);

          const icon = L.divIcon({
            className: 'vertex-label',
            html: `<div style="
              background: ${primaryColor};
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
            ">${index + 1}</div>`,
            iconSize: [20, 20],
          });

          L.marker(point as any, { icon }).addTo(map);

          return marker;
        });

        try {
          map.fitBounds(layersRef.current.polygon.getBounds(), { padding: [50, 50] });
        } catch (e) {
          // Ignore bounds error
        }
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
    
    toast({ title: 'Acquiring GPS position...', description: 'Please wait' });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        if (accuracy > 50) {
          toast({
            variant: 'destructive',
            title: 'Low GPS Accuracy',
            description: `Current accuracy: ${accuracy.toFixed(0)}m. Consider waiting for better signal.`,
          });
        }
        handleAddPoint(position.coords.latitude, position.coords.longitude);
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => toast({ variant: 'destructive', title: 'GPS Error', description: error.message }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClear = () => {
    setPoints([]);
    setMarkerPosition(null);
    onChange(null);
    toast({ title: 'Geometry cleared' });
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-sm">
          {inputMethod === 'sketch' ? <Pencil className="w-3 h-3 mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
          {inputMethod === 'sketch' ? 'Sketch Mode' : 'GPS Mode'}
        </Badge>
        <Badge variant="secondary" className="text-sm">
          {geometryType === 'point' ? 'Point' : geometryType === 'linestring' ? 'Line' : 'Polygon'}
        </Badge>
        {isStreaming && (
          <Badge variant="default" className="text-sm animate-pulse">
            ● Recording
          </Badge>
        )}
      </div>

      <div className="border-2 rounded-lg overflow-hidden relative" style={{ height: '450px' }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        <DrawingControls
          geometryType={geometryType}
          inputMethod={inputMethod}
          onAddPoint={handleGPSPoint}
          onClear={handleClear}
          onUndo={handleUndo}
          onToggleStreaming={() => setIsStreaming(!isStreaming)}
          isStreaming={isStreaming}
          hasPoints={points.length > 0 || markerPosition !== null}
          canUndo={points.length > 0}
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
