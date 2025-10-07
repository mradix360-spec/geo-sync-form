import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
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
  responses: any[];
}

// Component to fit bounds to all markers
function FitBounds({ responses }: { responses: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (responses.length > 0) {
      const validCoords = responses
        .filter(r => r.geojson?.geometry?.coordinates)
        .map(r => {
          const coords = r.geojson.geometry.coordinates;
          return [coords[1], coords[0]] as [number, number]; // Leaflet uses [lat, lng]
        });

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [responses, map]);

  return null;
}

const MapView = ({ responses }: MapViewProps) => {
  const defaultCenter: [number, number] = [0, 0];
  const defaultZoom = 2;

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds responses={responses} />

        {responses.map((response, index) => {
          if (!response.geojson?.geometry?.coordinates) return null;
          
          const coords = response.geojson.geometry.coordinates;
          const position: [number, number] = [coords[1], coords[0]]; // Leaflet uses [lat, lng]

          return (
            <Marker key={index} position={position}>
              <Popup>
                <div className="text-sm">
                  <strong>Response #{index + 1}</strong>
                  {response.geojson.properties && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(response.geojson.properties).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
