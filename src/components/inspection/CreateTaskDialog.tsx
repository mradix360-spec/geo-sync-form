import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useAssets } from '@/hooks/use-assets';
import { useAssetGroups } from '@/hooks/use-asset-groups';
import { useForms } from '@/hooks/use-forms';
import { Package } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateTaskDialog = ({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) => {
  const { user } = useAuth();
  const { assets } = useAssets();
  const { assetGroups } = useAssetGroups();
  const { forms } = useForms();
  const [loading, setLoading] = useState(false);
  const [assetSelectionMode, setAssetSelectionMode] = useState<'single' | 'multiple' | 'group'>('single');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asset_id: '',
    selected_asset_ids: [] as string[],
    asset_group_id: '',
    form_id: '',
    priority: 'medium',
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organisation_id) return;

    setLoading(true);
    try {
      let asset_group_ids: string[] = [];
      
      if (assetSelectionMode === 'multiple') {
        asset_group_ids = formData.selected_asset_ids;
      } else if (assetSelectionMode === 'group') {
        const selectedGroup = assetGroups.find(g => g.id === formData.asset_group_id);
        asset_group_ids = selectedGroup?.asset_ids || [];
      }

      const taskData: any = {
        organisation_id: user.organisation_id,
        asset_id: assetSelectionMode === 'single' && formData.asset_id ? formData.asset_id : null,
        form_id: formData.form_id || null,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        due_date: formData.due_date || null,
        created_by: user.id,
      };

      // Only add asset_group_ids if there are multiple assets selected
      if (asset_group_ids.length > 0) {
        taskData.asset_group_ids = asset_group_ids;
      }

      const { error } = await supabase.from('inspection_tasks').insert(taskData);

      if (error) throw error;

      toast({
        title: 'Task created',
        description: `Inspection task created successfully${asset_group_ids.length > 0 ? ` with ${asset_group_ids.length} assets` : ''}.`,
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        asset_id: '',
        selected_asset_ids: [],
        asset_group_id: '',
        form_id: '',
        priority: 'medium',
        due_date: '',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating task',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_asset_ids: prev.selected_asset_ids.includes(assetId)
        ? prev.selected_asset_ids.filter(id => id !== assetId)
        : [...prev.selected_asset_ids, assetId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Inspection Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Asset Selection</Label>
            <Tabs value={assetSelectionMode} onValueChange={(v) => setAssetSelectionMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single">Single Asset</TabsTrigger>
                <TabsTrigger value="multiple">Multiple Assets</TabsTrigger>
                <TabsTrigger value="group">Asset Group</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-2">
                <Select
                  value={formData.asset_id}
                  onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.asset_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="multiple" className="space-y-2">
                <ScrollArea className="h-[200px] border rounded-md p-3">
                  {assets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No assets available</p>
                  ) : (
                    <div className="space-y-2">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => toggleAssetSelection(asset.id)}
                        >
                          <Checkbox
                            checked={formData.selected_asset_ids.includes(asset.id)}
                            onCheckedChange={() => toggleAssetSelection(asset.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{asset.asset_id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {formData.selected_asset_ids.length} asset(s) selected
                </p>
              </TabsContent>

              <TabsContent value="group" className="space-y-2">
                <Select
                  value={formData.asset_group_id}
                  onValueChange={(value) => setFormData({ ...formData, asset_group_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset group" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>{group.name} ({group.asset_ids.length} assets)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="form">Inspection Form (Optional)</Label>
            <Select
              value={formData.form_id}
              onValueChange={(value) => setFormData({ ...formData, form_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select form" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
