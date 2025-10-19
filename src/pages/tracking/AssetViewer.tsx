import { useState } from 'react';
import { MapToggle } from '@/components/tracking/MapToggle';
import { AssetMap2D } from '@/components/tracking/AssetMap2D';
import { AssetMap3D } from '@/components/tracking/AssetMap3D';
import { AssetFilters } from '@/components/tracking/AssetFilters';
import { useAssets } from '@/hooks/use-assets';
import { Asset } from '@/types/tracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AssetViewer = () => {
  const [mode, setMode] = useState<'2D' | '3D'>('2D');
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const { assets, loading } = useAssets();

  const filteredAssets = assets.filter(asset => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(asset.type)) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(asset.status)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading assets...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Asset Viewer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize assets in 2D or 3D
          </p>
        </div>

        <AssetFilters
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
        />

        {selectedAsset && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-semibold">{selectedAsset.name}</p>
                <p className="text-xs text-muted-foreground">ID: {selectedAsset.asset_id}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-secondary capitalize">
                  {selectedAsset.type}
                </span>
                <span className="px-2 py-1 rounded-full bg-secondary capitalize">
                  {selectedAsset.status}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapToggle mode={mode} onModeChange={setMode} />
        
        {mode === '2D' ? (
          <AssetMap2D
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            onAssetSelect={setSelectedAsset}
          />
        ) : (
          <AssetMap3D
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            onAssetSelect={setSelectedAsset}
          />
        )}
      </div>
    </div>
  );
};

export default AssetViewer;
