import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InspectionTask } from '@/types/tracking';
import { FileText, Camera, Glasses, ArrowLeft } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';

const InspectionPerform = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<InspectionTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'form' | 'camera' | 'vr'>('form');
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

  const handleComplete = async () => {
    if (!task || !user) return;

    try {
      // Update task status
      await supabase
        .from('inspection_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Create inspection response
      await supabase.from('inspection_responses').insert({
        task_id: task.id,
        asset_id: task.asset_id,
        user_id: user.id,
        inspection_mode: mode,
        gps_location: gpsLocation.latitude && gpsLocation.longitude 
          ? `POINT(${gpsLocation.longitude} ${gpsLocation.latitude})`
          : null,
        gps_accuracy: gpsLocation.accuracy,
        completed_at: new Date().toISOString(),
      });

      toast({
        title: 'Inspection completed',
        description: 'Task has been marked as complete.',
      });

      navigate('/field/inspections');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error completing inspection',
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
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="form">
                  <FileText className="w-4 h-4 mr-2" />
                  Form
                </TabsTrigger>
                <TabsTrigger value="camera">
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </TabsTrigger>
                <TabsTrigger value="vr">
                  <Glasses className="w-4 h-4 mr-2" />
                  VR Mode
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="space-y-4 mt-6">
                <div className="prose max-w-none">
                  <h3>Form Inspection</h3>
                  {task.form ? (
                    <p>Form-based inspection interface will go here.</p>
                  ) : (
                    <p className="text-muted-foreground">No form linked to this task.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="camera" className="space-y-4 mt-6">
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera inspection mode</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click button below to activate camera
                  </p>
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
                onClick={() => navigate('/field/inspections')}
                className="flex-1"
              >
                Save Draft
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                Complete Inspection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InspectionPerform;
