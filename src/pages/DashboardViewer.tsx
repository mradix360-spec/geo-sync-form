import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { WidgetRenderer } from '@/components/dashboards/WidgetRenderer';
import { ArrowLeft, Edit, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="bg-card/95 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-20" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </header>
        <div className="max-w-[1800px] mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[300px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <EmptyState
            icon={LayoutDashboard}
            title="Dashboard Not Found"
            description="This dashboard is not available or may have been deleted."
            actionLabel="Go Back"
            onAction={() => navigate(-1)}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="bg-card/95 backdrop-blur-sm border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {dashboardConfig.title}
                </h1>
                {dashboardConfig.description && (
                  <p className="text-sm text-muted-foreground mt-1">{dashboardConfig.description}</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => navigate(`/dashboard-builder/${id}`)}
              className="gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Dashboard
            </Button>
          </div>
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
