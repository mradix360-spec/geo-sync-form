import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Map } from 'lucide-react';
import { parseCSV, parseGeoJSON, validateAssetData } from '@/lib/assetImport';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ParsedAssetData } from '@/types/tracking';

interface AssetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssetUploadDialog = ({ open, onOpenChange, onSuccess }: AssetUploadDialogProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedAssetData[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      let parsed: ParsedAssetData[];
      
      if (selectedFile.name.endsWith('.csv')) {
        parsed = await parseCSV(selectedFile);
      } else if (selectedFile.name.endsWith('.geojson') || selectedFile.name.endsWith('.json')) {
        parsed = await parseGeoJSON(selectedFile);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload a CSV or GeoJSON file.',
        });
        return;
      }

      const { valid, errors } = validateAssetData(parsed);
      
      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Validation errors',
          description: `${errors.length} errors found. First error: ${errors[0]}`,
        });
      }

      setPreview(valid);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error parsing file',
        description: error.message,
      });
    }
  };

  const handleImport = async () => {
    if (!user?.organisation_id || preview.length === 0) return;

    setLoading(true);
    try {
      // Upload file to storage
      let fileUrl: string | undefined;
      if (file) {
        const filePath = `${user.organisation_id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('asset-models')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('asset-models')
            .getPublicUrl(filePath);
          fileUrl = publicUrl;
        }
      }

      // Create assets
      const assetsToInsert = preview.map(asset => ({
        organisation_id: user.organisation_id,
        name: asset.name,
        asset_id: asset.asset_id,
        type: asset.type,
        status: asset.status || 'active',
        coordinates: asset.latitude && asset.longitude 
          ? `POINT(${asset.longitude} ${asset.latitude})`
          : null,
        metadata: asset.metadata,
        created_by: user.id,
      }));

      const { error: insertError } = await supabase
        .from('assets')
        .insert(assetsToInsert);

      if (insertError) throw insertError;

      // Log the import
      await supabase.from('asset_imports').insert({
        organisation_id: user.organisation_id,
        file_name: file?.name || 'manual_import',
        file_url: fileUrl,
        import_type: file?.name.endsWith('.csv') ? 'csv' : 'geojson',
        total_records: preview.length,
        successful_imports: preview.length,
        failed_imports: 0,
        imported_by: user.id,
      });

      toast({
        title: 'Import successful',
        description: `${preview.length} assets imported successfully.`,
      });

      onSuccess();
      onOpenChange(false);
      setFile(null);
      setPreview([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Assets</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={preview.length === 0}>
              <Map className="w-4 h-4 mr-2" />
              Preview ({preview.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select CSV or GeoJSON file</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.geojson,.json"
                onChange={handleFileSelect}
              />
              <p className="text-sm text-muted-foreground">
                CSV must include: name, asset_id, type, latitude, longitude
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="w-5 h-5" />
                <span className="text-sm">{file.name}</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((asset, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{asset.name}</td>
                      <td className="p-2">{asset.asset_id}</td>
                      <td className="p-2">{asset.type}</td>
                      <td className="p-2">
                        {asset.latitude && asset.longitude
                          ? `${asset.latitude.toFixed(4)}, ${asset.longitude.toFixed(4)}`
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <p className="text-sm text-muted-foreground p-2">
                  Showing first 50 of {preview.length} assets
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0 || loading}
          >
            Import {preview.length} Assets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
