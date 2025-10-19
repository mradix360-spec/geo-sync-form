import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Asset } from '@/types/tracking';

interface AssetMap2DProps {
  assets: Asset[];
  selectedAsset?: Asset;
  onAssetSelect?: (asset: Asset) => void;
}

export const AssetMap2D = ({ assets, selectedAsset, onAssetSelect }: AssetMap2DProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    const markers: L.Marker[] = [];
    const bounds: L.LatLngExpression[] = [];

    assets.forEach(asset => {
      if (!asset.coordinates) return;

      const [lng, lat] = asset.coordinates.coordinates;
      const latLng: L.LatLngExpression = [lat, lng];
      bounds.push(latLng);

      const marker = L.marker(latLng, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${selectedAsset?.id === asset.id ? '#3b82f6' : '#64748b'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        }),
      });

      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold">${asset.name}</h3>
          <p class="text-sm">ID: ${asset.asset_id}</p>
          <p class="text-sm">Type: ${asset.type}</p>
          <p class="text-sm capitalize">Status: ${asset.status}</p>
        </div>
      `);

      marker.on('click', () => {
        if (onAssetSelect) {
          onAssetSelect(asset);
        }
      });

      marker.addTo(mapRef.current!);
      markers.push(marker);
    });

    markersRef.current = markers;

    // Fit bounds if we have markers
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds as any, { padding: [50, 50] });
    }
  }, [assets, selectedAsset, onAssetSelect]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
  );
};
