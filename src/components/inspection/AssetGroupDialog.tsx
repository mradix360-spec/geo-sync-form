import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssets } from '@/hooks/use-assets';
import { useAssetGroups } from '@/hooks/use-asset-groups';
import { AssetGroup } from '@/types/tracking';
import { Search } from 'lucide-react';

interface AssetGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: AssetGroup | null;
  onSuccess: () => void;
}

export const AssetGroupDialog = ({ open, onOpenChange, group, onSuccess }: AssetGroupDialogProps) => {
  const { assets } = useAssets();
  const { createAssetGroup, updateAssetGroup } = useAssetGroups();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_ids: [] as string[],
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        asset_ids: group.asset_ids || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        asset_ids: [],
      });
    }
  }, [group, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (group) {
        await updateAssetGroup(group.id, formData);
      } else {
        await createAssetGroup(formData);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setLoading(false);
    }
  };

  const toggleAsset = (assetId: string) => {
    setFormData(prev => ({
      ...prev,
      asset_ids: prev.asset_ids.includes(assetId)
        ? prev.asset_ids.filter(id => id !== assetId)
        : [...prev.asset_ids, assetId],
    }));
  };

  const toggleAll = () => {
    const filtered = filteredAssets.map(a => a.id);
    const allSelected = filtered.every(id => formData.asset_ids.includes(id));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        asset_ids: prev.asset_ids.filter(id => !filtered.includes(id)),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        asset_ids: [...new Set([...prev.asset_ids, ...filtered])],
      }));
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = formData.asset_ids.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{group ? 'Edit' : 'Create'} Asset Group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Water Pumps Zone A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this asset group"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Assets ({selectedCount} selected)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAll}
              >
                {filteredAssets.every(a => formData.asset_ids.includes(a.id)) ? 'Deselect' : 'Select'} All
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] border rounded-md p-4">
              {filteredAssets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No assets found</p>
              ) : (
                <div className="space-y-2">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                    >
                      <Checkbox
                        checked={formData.asset_ids.includes(asset.id)}
                        onCheckedChange={() => toggleAsset(asset.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.asset_id} • {asset.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedCount === 0}>
              {group ? 'Update' : 'Create'} Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
