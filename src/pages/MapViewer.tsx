import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Map as MapIcon, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const MapViewer = () => {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId: string }>();
  const { user } = useAuth();

  const handleBack = () => {
    const isFieldStaff = user?.roles.includes('field_staff');
    navigate(isFieldStaff ? '/field' : '/analyst/maps');
  };

  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTitle, setFormTitle] = useState('');
  const [selectedBasemap, setSelectedBasemap] = useState('osm');

  const basemaps = [
    {
      id: 'osm',
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    },
    {
      id: 'satellite',
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri'
    },
    {
      id: 'topo',
      name: 'Topographic',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap'
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO'
    },
    {
      id: 'light',
      name: 'Light Mode',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO'
    },
    {
      id: 'terrain',
      name: 'Terrain',
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
      attribution: '&copy; Stamen Design'
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
      attribution: '&copy; Stamen Design'
    }
  ];

  const currentBasemap = basemaps.find(b => b.id === selectedBasemap) || basemaps[0];

  useEffect(() => {
    if (!formId) {
      handleBack();
      return;
    }
    loadResponses();
  }, [formId]);

  const loadResponses = async () => {
    try {
      // Load form info
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('title')
        .eq('id', formId)
        .single();

      if (formError) throw formError;
      setFormTitle(formData.title);

      // Load responses
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId);

      if (error) throw error;
      setResponses(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading responses",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await supabase.functions.invoke('export-geojson', {
        body: { formId }
      });

      if (response.error) throw response.error;

      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formTitle || 'export'}_${new Date().toISOString()}.geojson`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "GeoJSON file downloaded",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-20" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          </header>
          <div className="flex-1 bg-muted/20 relative">
            <Skeleton className="absolute inset-0" />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 justify-between z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{formTitle}</h1>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </header>

        <div className="flex flex-1 w-full overflow-hidden">
          <Sidebar collapsible="icon">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Basemaps</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {basemaps.map((basemap) => (
                      <SidebarMenuItem key={basemap.id}>
                        <SidebarMenuButton
                          isActive={selectedBasemap === basemap.id}
                          onClick={() => setSelectedBasemap(basemap.id)}
                        >
                          <MapIcon className="w-4 h-4" />
                          <span>{basemap.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {responses.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel>
                    Responses ({responses.length})
                  </SidebarGroupLabel>
                  <SidebarGroupContent className="px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                      {responses.length} location{responses.length !== 1 ? 's' : ''} on map
                    </p>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 relative">
            <MapView 
              responses={responses} 
              basemapUrl={currentBasemap.url}
              basemapAttribution={currentBasemap.attribution}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MapViewer;
