import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { WidgetRenderer } from '@/components/dashboards/WidgetRenderer';
import { ArrowLeft, Edit } from 'lucide-react';

interface DashboardConfig {
  title: string;
  description: string;
  config: {
    widgets: Array<{
      id: string;
      type: string;
      config: any;
      position: { x: number; y: number; w: number; h: number };
    }>;
  };
}

export default function DashboardViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const { data: dashboardData, error: dashboardError } = await supabase
        .from('dashboards')
        .select('*')
        .eq('id', id)
        .single();

      if (dashboardError) throw dashboardError;

      setDashboardConfig({
        title: dashboardData.title,
        description: dashboardData.description,
        config: dashboardData.config as any,
      });
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load dashboard',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2">Dashboard Not Found</h2>
          <p className="text-muted-foreground">This dashboard is not available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{dashboardConfig.title}</h1>
              {dashboardConfig.description && (
                <p className="text-sm text-muted-foreground mt-1">{dashboardConfig.description}</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => navigate(`/dashboard-builder/${id}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Dashboard
          </Button>
        </div>
      </header>
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardConfig.config.widgets?.map((widget) => (
            <div
              key={widget.id}
              className="min-h-[300px]"
              style={{
                gridColumn: `span ${widget.position.w}`,
                gridRow: `span ${widget.position.h}`,
              }}
            >
              <WidgetRenderer widget={widget} onUpdate={() => {}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
