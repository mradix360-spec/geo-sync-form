import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { WidgetRenderer } from '@/components/dashboards/WidgetRenderer';

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

export default function PublicDashboardViewer() {
  const { token } = useParams();
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [token]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('object_id')
        .eq('token', token)
        .eq('access_type', 'public')
        .eq('object_type', 'dashboard')
        .maybeSingle();

      if (shareError || !share) {
        throw new Error('Invalid or expired share link');
      }

      const { data: dashboardData, error: dashboardError } = await supabase
        .from('dashboards')
        .select('*')
        .eq('id', share.object_id)
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="bg-card/95 backdrop-blur-sm border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {dashboardConfig.title}
          </h1>
          {dashboardConfig.description && (
            <p className="text-sm text-muted-foreground mt-1">{dashboardConfig.description}</p>
          )}
        </div>
      </header>
      
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {dashboardConfig.config.widgets?.map((widget, index) => (
            <div
              key={widget.id}
              className="min-h-[300px] animate-scale-in"
              style={{
                gridColumn: `span ${widget.position.w}`,
                gridRow: `span ${widget.position.h}`,
                animationDelay: `${index * 50}ms`
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
