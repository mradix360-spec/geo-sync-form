import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InspectionTask } from '@/types/tracking';
import { FileText, Camera, Glasses, ArrowLeft, AlertCircle } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { CameraCapture } from '@/components/inspection/CameraCapture';
import { Alert, AlertDescription } from '@/components/ui/alert';

const InspectionPerform = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<InspectionTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'form' | 'camera' | 'vr'>('camera');
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [formData, setFormData] = useState<any>(null);
  const gpsLocation = useGeolocation(true);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inspection_tasks')
        .select(`
          *,
          asset:assets(*),
          form:forms(*)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;

      setTask(data as any);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading task',
        description: error.message,
      });
      navigate('/field/inspections');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (photoDataUrl: string) => {
    setPhotos(prev => [...prev, photoDataUrl]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const canComplete = () => {
    // Must have at least one of: photos, notes, or form data
    return photos.length > 0 || notes.trim().length > 0 || formData !== null;
  };

  const handleComplete = async () => {
    if (!task || !user) return;

    if (!canComplete()) {
      toast({
        variant: 'destructive',
        title: 'Cannot complete inspection',
        description: 'Please add photos, notes, or complete the form before finishing.',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Create inspection response first
      const { data: response, error: responseError } = await supabase
        .from('inspection_responses')
        .insert({
          task_id: task.id,
          asset_id: task.asset_id,
          user_id: user.id,
          inspection_mode: mode,
          photos: photos,
          notes: notes || null,
          gps_location: gpsLocation.latitude && gpsLocation.longitude 
            ? `POINT(${gpsLocation.longitude} ${gpsLocation.latitude})`
            : null,
          gps_accuracy: gpsLocation.accuracy,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Update task status to completed
      const { error: taskError } = await supabase
        .from('inspection_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      toast({
        title: 'Inspection completed',
        description: `Task completed with ${photos.length} photo(s).`,
      });

      navigate('/field/inspections');
    } catch (error: any) {
      console.error('Error completing inspection:', error);
      toast({
        variant: 'destructive',
        title: 'Error completing inspection',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!task || !user) return;

    try {
      // Update task status to in_progress
      await supabase
        .from('inspection_tasks')
        .update({ status: 'in_progress' })
        .eq('id', task.id);

      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved.',
      });

      navigate('/field/inspections');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving draft',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading task...</div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container max-w-4xl mx-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/field/inspections')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inspections
          </Button>
          
          <h1 className="text-2xl font-bold">{task.title}</h1>
          {task.asset && (
            <p className="text-muted-foreground">Asset: {task.asset.name}</p>
          )}
          {gpsLocation.latitude && gpsLocation.longitude && (
            <p className="text-sm text-muted-foreground mt-2">
              GPS: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)} 
              (±{gpsLocation.accuracy?.toFixed(0)}m)
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        {!canComplete() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add photos, notes, or complete the form to finish this inspection.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="camera">
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                  {photos.length > 0 && (
                    <span className="ml-1 text-xs">({photos.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="form" disabled={!task.form}>
                  <FileText className="w-4 h-4 mr-2" />
                  Form
                </TabsTrigger>
                <TabsTrigger value="vr" disabled>
                  <Glasses className="w-4 h-4 mr-2" />
                  VR
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="space-y-4 mt-6">
                <CameraCapture
                  taskId={task.id}
                  onPhotoCapture={handlePhotoCapture}
                  photos={photos}
                  onRemovePhoto={handleRemovePhoto}
                />
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="notes">Inspection Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add observations, issues found, or recommendations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {notes.length} characters
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="form" className="space-y-4 mt-6">
                <div className="text-center py-8">
                  {task.form ? (
                    <div>
                      <FileText className="w-12 h-12 mx-auto mb-3 text-primary" />
                      <p className="font-medium mb-2">{task.form.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Form submission will be available in the next update
                      </p>
                    </div>
                  ) : (
                    <div>
                      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No form linked to this task</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="vr" className="space-y-4 mt-6">
                <div className="text-center py-12">
                  <Glasses className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">VR mode requires WebXR support</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Feature coming soon
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="flex-1"
                disabled={submitting}
              >
                Save Draft
              </Button>
              <Button 
                onClick={handleComplete} 
                className="flex-1"
                disabled={!canComplete() || submitting}
              >
                {submitting ? 'Completing...' : 'Complete Inspection'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InspectionPerform;
