import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, RefreshCw, Globe, MapPin, Layers } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GISIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formTitle: string;
  shareToken?: string;
  onTokenRegenerated?: () => void;
}

export const GISIntegrationDialog = ({
  open,
  onOpenChange,
  formId,
  formTitle,
  shareToken,
  onTokenRegenerated,
}: GISIntegrationDialogProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const projectRef = 'shqclgwsgmlnimcggxch';
  const baseUrl = `https://${projectRef}.supabase.co/functions/v1`;
  
  const geojsonUrl = shareToken 
    ? `${baseUrl}/public-geojson-feed?token=${shareToken}&formId=${formId}`
    : 'Generate a public share link first';
    
  const wfsUrl = shareToken
    ? `${baseUrl}/wfs-service?token=${shareToken}&service=WFS&version=2.0.0&request=GetFeature&typeName=form_${formId}&outputFormat=application/json`
    : 'Generate a public share link first';
    
  const arcgisUrl = shareToken
    ? `${baseUrl}/arcgis-feature-service/${formId}/query?token=${shareToken}&where=1=1&outFields=*&f=geojson`
    : 'Generate a public share link first';

  const copyToClipboard = (text: string, label: string) => {
    if (text.includes('Generate a public share')) {
      toast({
        title: 'Share link required',
        description: 'Please create a public share link first from the Share dialog',
        variant: 'destructive',
      });
      return;
    }
    
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${label} URL copied successfully`,
    });
  };

  const handleRegenerateToken = async () => {
    setIsRegenerating(true);
    try {
      if (shareToken) {
        await supabase.from('shares').delete().eq('token', shareToken);
      }
      
      const { data, error } = await supabase
        .from('shares')
        .insert({
          object_id: formId,
          object_type: 'form',
          access_type: 'public',
          token: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Token regenerated',
        description: 'New GIS integration token created successfully',
      });
      
      onTokenRegenerated?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            GIS Integration - {formTitle}
          </DialogTitle>
          <DialogDescription>
            Connect this form to QGIS, ArcGIS Pro, or other GIS applications using the URLs below
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="geojson" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geojson">
              <Globe className="w-4 h-4 mr-2" />
              GeoJSON Feed
            </TabsTrigger>
            <TabsTrigger value="wfs">
              <MapPin className="w-4 h-4 mr-2" />
              WFS Service
            </TabsTrigger>
            <TabsTrigger value="arcgis">
              <Layers className="w-4 h-4 mr-2" />
              ArcGIS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geojson" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="geojson-url">Live GeoJSON Feed URL</Label>
              <div className="flex gap-2">
                <Input
                  id="geojson-url"
                  value={geojsonUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(geojsonUrl, 'GeoJSON')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold">How to add in QGIS:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open QGIS Desktop</li>
                <li>Go to <strong>Layer → Add Layer → Add Vector Layer</strong></li>
                <li>Select <strong>Protocol: HTTP(S), cloud, etc.</strong></li>
                <li>Set <strong>Protocol Type: GeoJSON</strong></li>
                <li>Paste the URL above into the <strong>URI</strong> field</li>
                <li>Click <strong>Add</strong></li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Right-click layer → Properties → Rendering → Refresh layer every N seconds for auto-updates
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold">How to add in ArcGIS Pro:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open ArcGIS Pro</li>
                <li>Go to <strong>Map → Add Data → Data from Path</strong></li>
                <li>Paste the URL above</li>
                <li>Click <strong>OK</strong></li>
              </ol>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ This is the recommended method for ArcGIS Pro
              </p>
            </div>
          </TabsContent>

          <TabsContent value="wfs" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wfs-url">WFS Service URL</Label>
              <div className="flex gap-2">
                <Input
                  id="wfs-url"
                  value={wfsUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(wfsUrl, 'WFS')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold">How to add WFS in QGIS:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open QGIS Desktop</li>
                <li>Go to <strong>Layer → Add Layer → Add WFS Layer</strong></li>
                <li>Click <strong>New</strong> to create a new connection</li>
                <li>Enter a name (e.g., "Field Data Collection")</li>
                <li>Paste the base URL (without parameters): <code className="bg-background px-1">{baseUrl}/wfs-service?token={shareToken || 'YOUR_TOKEN'}</code></li>
                <li>Click <strong>OK</strong>, then <strong>Connect</strong></li>
                <li>Select the layer and click <strong>Add</strong></li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                ℹ️ WFS provides schema information and supports advanced queries
              </p>
            </div>
          </TabsContent>

          <TabsContent value="arcgis" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="arcgis-url">ArcGIS REST API URL</Label>
              <div className="flex gap-2">
                <Input
                  id="arcgis-url"
                  value={arcgisUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(arcgisUrl, 'ArcGIS')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                ⚠️ ArcGIS Pro Limitation
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                ArcGIS Pro's "Add Data from Path" does not support external REST Feature Services. Use one of the alternative methods below.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold">Method 1: Use GeoJSON Feed (Recommended)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Switch to the <strong>GeoJSON Feed</strong> tab above</li>
                <li>Copy the GeoJSON URL</li>
                <li>In ArcGIS Pro, go to <strong>Map → Add Data → Data from Path</strong></li>
                <li>Paste the GeoJSON URL and click <strong>OK</strong></li>
              </ol>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ This method works reliably in ArcGIS Pro
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold">Method 2: Download and Import</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open the GeoJSON URL in your web browser</li>
                <li>Save the file as <code className="bg-background px-1">{formTitle.replace(/[^a-z0-9]/gi, '_')}.geojson</code></li>
                <li>In ArcGIS Pro, drag and drop the file into your map</li>
                <li>Or use <strong>Map → Add Data</strong> and browse to the file</li>
              </ol>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold">Method 3: Python Script (Advanced)</h4>
              <p className="text-sm">Open the Python window in ArcGIS Pro and run:</p>
              <div className="bg-background p-3 rounded font-mono text-xs overflow-x-auto">
                <code>
                  import arcpy<br/>
                  arcpy.conversion.JSONToFeatures(<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;"{geojsonUrl}",<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;"FormData"<br/>
                  )
                </code>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h4 className="font-semibold">For ArcGIS Online:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click <strong>Add → Add Layer from Web</strong></li>
                <li>Choose <strong>A GeoJSON File</strong></li>
                <li>Paste the GeoJSON URL from the first tab</li>
                <li>Click <strong>Add Layer</strong></li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                ℹ️ ArcGIS Online supports direct GeoJSON URLs
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {shareToken ? (
              <span>Token: <code className="bg-muted px-2 py-1 rounded">{shareToken.slice(0, 8)}...</code></span>
            ) : (
              <span>No public share token exists</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateToken}
            disabled={isRegenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate Token
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
