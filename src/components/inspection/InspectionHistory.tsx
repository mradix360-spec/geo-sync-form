import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Camera, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InspectionResponse {
  id: string;
  task_id: string;
  inspection_mode: string;
  photos: string[];
  notes: string | null;
  gps_accuracy: number | null;
  completed_at: string;
  task: {
    title: string;
    asset: {
      name: string;
    } | null;
  };
}

export const InspectionHistory = () => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<InspectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<InspectionResponse | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inspection_responses')
        .select(`
          *,
          task:inspection_tasks(
            title,
            asset:assets(name)
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setResponses(data as any || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading history...</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {responses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No completed inspections yet.</p>
          </Card>
        ) : (
          responses.map((response) => (
            <Card 
              key={response.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedResponse(response)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      {response.task?.title || 'Unnamed Task'}
                    </h4>
                    {response.task?.asset && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {response.task.asset.name}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {response.inspection_mode}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(response.completed_at), 'MMM dd, HH:mm')}
                  </span>
                  {response.photos && response.photos.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {response.photos.length} photo(s)
                    </span>
                  )}
                  {response.gps_accuracy && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      ±{response.gps_accuracy.toFixed(0)}m
                    </span>
                  )}
                </div>

                {response.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {response.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedResponse?.task?.title}</DialogTitle>
          </DialogHeader>

          {selectedResponse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <p className="font-medium">
                    {format(new Date(selectedResponse.completed_at), 'PPP p')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <p className="font-medium capitalize">{selectedResponse.inspection_mode}</p>
                </div>
                {selectedResponse.task?.asset && (
                  <div>
                    <span className="text-muted-foreground">Asset:</span>
                    <p className="font-medium">{selectedResponse.task.asset.name}</p>
                  </div>
                )}
                {selectedResponse.gps_accuracy && (
                  <div>
                    <span className="text-muted-foreground">GPS Accuracy:</span>
                    <p className="font-medium">±{selectedResponse.gps_accuracy.toFixed(0)}m</p>
                  </div>
                )}
              </div>

              {selectedResponse.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Notes:</span>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedResponse.notes}</p>
                </div>
              )}

              {selectedResponse.photos && selectedResponse.photos.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">
                    Photos ({selectedResponse.photos.length}):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedResponse.photos.map((photo, index) => (
                      <a
                        key={index}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        <img
                          src={photo}
                          alt={`Inspection ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
