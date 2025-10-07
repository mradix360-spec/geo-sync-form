import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Layers as LayersIcon, Map as MapIcon, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";
import { MapLayerPanel } from "@/components/maps/MapLayerPanel";
import { MapBasemapPanel } from "@/components/maps/MapBasemapPanel";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SymbolType, SymbolSize } from "@/lib/mapSymbols";

interface MapLayer {
  id: string;
  formId: string;
  formTitle: string;
  visible: boolean;
  color: string;
  symbolType?: SymbolType;
  symbolSize?: SymbolSize;
  responses?: any[];
}

const BASEMAPS = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    thumbnail: '🗺️'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    thumbnail: '🛰️'
  },
  {
    id: 'topo',
    name: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    thumbnail: '⛰️'
  },
  {
    id: 'dark',
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    thumbnail: '🌙'
  },
  {
    id: 'light',
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    thumbnail: '☀️'
  },
];

const MapBuilder = () => {
  const navigate = useNavigate();
  const { mapId } = useParams<{ mapId?: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBasemap, setSelectedBasemap] = useState(BASEMAPS[0]);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [shareType, setShareType] = useState("private");

  useEffect(() => {
    if (mapId) {
      loadMap();
    }
  }, [mapId]);

  const loadMap = async () => {
    if (!mapId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maps")
        .select("*")
        .eq("id", mapId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setDescription(data.description || "");
      
      const config = (data.config || {}) as any;
      if (config.basemap) {
        const basemap = BASEMAPS.find(b => b.id === config.basemap);
        if (basemap) setSelectedBasemap(basemap);
      }
      
      if (config.layers && Array.isArray(config.layers)) {
        const loadedLayers = await Promise.all(
          config.layers.map(async (layer: any) => {
            const { data: formData } = await supabase
              .from("forms")
              .select("title")
              .eq("id", layer.formId)
              .single();

            const { data: responses } = await supabase
              .from("form_responses")
              .select("*")
              .eq("form_id", layer.formId);

            return {
              id: layer.id || crypto.randomUUID(),
              formId: layer.formId,
              formTitle: formData?.title || "Unknown Form",
              visible: layer.visible ?? true,
              color: layer.color || "#3b82f6",
              symbolType: layer.symbolType || 'circle',
              symbolSize: layer.symbolSize || 'medium',
              responses: responses || [],
            };
          })
        );
        setLayers(loadedLayers);
      }

      // Load share settings
      const { data: shareData } = await supabase
        .from("shares")
        .select("access_type")
        .eq("object_id", mapId)
        .eq("object_type", "map")
        .single();

      if (shareData) {
        setShareType(shareData.access_type);
      }
    } catch (error: any) {
      console.error("Error loading map:", error);
      toast({
        variant: "destructive",
        title: "Error loading map",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Map title is required",
      });
      return;
    }

    try {
      setSaving(true);

      const mapConfig = {
        basemap: selectedBasemap.id,
        layers: layers.map(l => ({
          id: l.id,
          formId: l.formId,
          visible: l.visible,
          color: l.color,
          symbolType: l.symbolType || 'circle',
          symbolSize: l.symbolSize || 'medium',
        })),
        viewport: {
          center: [0, 20],
          zoom: 3,
        },
      };

      if (mapId) {
        // Update existing map
        const { error } = await supabase
          .from("maps")
          .update({
            title,
            description,
            config: mapConfig,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mapId);

        if (error) throw error;

        // Update share settings
        const { data: existingShare } = await supabase
          .from("shares")
          .select("id")
          .eq("object_id", mapId)
          .eq("object_type", "map")
          .single();

        if (shareType === "private" && existingShare) {
          await supabase
            .from("shares")
            .delete()
            .eq("id", existingShare.id);
        } else if (shareType !== "private") {
          if (existingShare) {
            await supabase
              .from("shares")
              .update({ access_type: shareType })
              .eq("id", existingShare.id);
          } else {
            await supabase.from("shares").insert({
              object_id: mapId,
              object_type: "map",
              access_type: shareType,
              organisation_id: user?.organisation_id,
            });
          }
        }

        toast({
          title: "Success",
          description: "Map updated successfully",
        });
      } else {
        // Create new map
        const { data: newMap, error: mapError } = await supabase
          .from("maps")
          .insert({
            title,
            description,
            config: mapConfig,
            organisation_id: user?.organisation_id,
            created_by: user?.id,
          })
          .select()
          .single();

        if (mapError) throw mapError;

        // Create share record if not private
        if (shareType !== "private") {
          await supabase.from("shares").insert({
            object_id: newMap.id,
            object_type: "map",
            access_type: shareType,
            organisation_id: user?.organisation_id,
          });
        }

        toast({
          title: "Success",
          description: "Map created successfully",
        });

        navigate(`/map-builder/${newMap.id}`);
      }
    } catch (error: any) {
      console.error("Error saving map:", error);
      toast({
        variant: "destructive",
        title: "Error saving map",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLayer = async (formId: string) => {
    try {
      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("title")
        .eq("id", formId)
        .single();

      if (formError) throw formError;

      const { data: responses, error: responsesError } = await supabase
        .from("form_responses")
        .select("*")
        .eq("form_id", formId);

      if (responsesError) throw responsesError;

      const newLayer: MapLayer = {
        id: crypto.randomUUID(),
        formId,
        formTitle: formData.title,
        visible: true,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        symbolType: 'circle',
        symbolSize: 'medium',
        responses: responses || [],
      };

      setLayers([...layers, newLayer]);
      toast({
        title: "Layer Added",
        description: `${formData.title} added to map`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding layer",
        description: error.message,
      });
    }
  };

  const handleRemoveLayer = (layerId: string) => {
    setLayers(layers.filter(l => l.id !== layerId));
  };

  const handleToggleLayer = (layerId: string) => {
    setLayers(layers.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ));
  };

  const handleChangeLayerColor = (layerId: string, color: string) => {
    setLayers(layers.map(l => 
      l.id === layerId ? { ...l, color } : l
    ));
  };

  const handleChangeSymbol = (layerId: string, symbolType: SymbolType) => {
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, symbolType } : l
    ));
  };

  const handleChangeSize = (layerId: string, symbolSize: SymbolSize) => {
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, symbolSize } : l
    ));
  };

  const visibleResponses = layers
    .filter(l => l.visible)
    .flatMap(l => (l.responses || []).map(r => ({
      geojson: r.geojson,
      symbolType: l.symbolType,
      symbolSize: l.symbolSize,
      color: l.color,
    })));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 justify-between z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/analyst/maps")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Maps
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {mapId ? "Edit Map" : "Create Map"}
            </h1>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Map"}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 w-full overflow-hidden">
          <Sidebar collapsible="icon" className="border-r">
            <SidebarContent>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Map Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter map title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter map description"
                      rows={3}
                    />
                  </div>

                  <Tabs defaultValue="layers" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="layers">
                        <LayersIcon className="w-4 h-4 mr-2" />
                        Layers
                      </TabsTrigger>
                      <TabsTrigger value="basemap">
                        <MapIcon className="w-4 h-4 mr-2" />
                        Basemap
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="layers" className="space-y-4">
                      <MapLayerPanel
                        layers={layers}
                        onAddLayer={handleAddLayer}
                        onRemoveLayer={handleRemoveLayer}
                        onToggleLayer={handleToggleLayer}
                        onChangeColor={handleChangeLayerColor}
                        onChangeSymbol={handleChangeSymbol}
                        onChangeSize={handleChangeSize}
                      />
                    </TabsContent>

                    <TabsContent value="basemap">
                      <MapBasemapPanel
                        basemaps={BASEMAPS}
                        selectedBasemap={selectedBasemap}
                        onSelectBasemap={setSelectedBasemap}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 relative">
            <MapView
              responses={visibleResponses}
              basemapUrl={selectedBasemap.url}
              basemapAttribution={selectedBasemap.attribution}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MapBuilder;
