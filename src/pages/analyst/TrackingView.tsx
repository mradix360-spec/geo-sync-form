import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AssetUploadDialog } from '@/components/tracking/AssetUploadDialog';
import { AssetList } from '@/components/tracking/AssetList';
import { useAssets } from '@/hooks/use-assets';

const TrackingView = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { refetch } = useAssets();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Asset Tracking</h1>
          <p className="text-muted-foreground">Manage and track your assets</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Import Assets
        </Button>
      </div>

      <AssetList />

      <AssetUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={refetch}
      />
    </div>
  );
};

export default TrackingView;
