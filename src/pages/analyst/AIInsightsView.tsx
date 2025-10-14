import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Star, 
  MessageSquare,
  Database,
  BarChart3,
  Send,
  MapPin,
  Download,
  Code2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useForms } from "@/hooks/use-forms";
import { useAuth } from "@/contexts/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapData {
  type: "map";
  features: Array<{
    lat: number;
    lng: number;
    properties: any;
  }>;
  center: [number, number];
  zoom: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mapData?: MapData;
  stats?: {
    total: number;
    by_form?: Record<string, number>;
    avg_rating?: number;
    recent_count?: number;
  };
}

interface QuickAction {
  label: string;
  query: string;
  icon: any;
  gradient: string;
}

const AIInsightsView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string>("all");
  const { forms, loading: formsLoading } = useForms();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickActions: QuickAction[] = [
    {
      label: "Last 7 Days",
      query: "Show me all responses from the last 7 days with a summary",
      icon: Calendar,
      gradient: "from-blue-500 via-blue-600 to-cyan-500"
    },
    {
      label: "Low Ratings",
      query: "Show me responses with ratings below 3 stars and explain the patterns",
      icon: Star,
      gradient: "from-orange-500 via-red-500 to-pink-500"
    },
    {
      label: "Map View",
      query: "Show me all responses on a map with their locations",
      icon: MapPin,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500"
    },
    {
      label: "Summary Stats",
      query: "Give me a comprehensive summary of all form responses with key statistics",
      icon: BarChart3,
      gradient: "from-purple-500 via-violet-500 to-pink-500"
    }
  ];

  const handleQuickAction = (query: string) => {
    setInput(query);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to use AI insights",
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      console.log("Sending request with userId:", user.id);
      
      const { data, error } = await supabase.functions.invoke("analyze-responses", {
        body: { 
          query: userMessage.content,
          messages: [...messages, userMessage],
          formId: selectedForm !== "all" ? selectedForm : undefined,
          userId: user.id
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        mapData: data.mapData,
        stats: data.stats
      };

      setMessages((prev) => [...prev, assistantMessage]);
  } catch (error: any) {
    console.error("Error analyzing responses:", error);
    
    let errorDescription = "Failed to analyze form responses";
    
    if (error.message?.includes("User ID is required")) {
      errorDescription = "Authentication error. Please refresh the page and try again.";
    } else if (error.message) {
      errorDescription = error.message;
    }
    
    toast({
      variant: "destructive",
      title: "Analysis failed",
      description: errorDescription,
    });
      
    const errorMessage: Message = {
      role: "assistant",
      content: "Sorry, I encountered an error analyzing your data. Please try again.",
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setLoading(false);
  }
};

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
        return (
          <div key={i} className="my-3 rounded-lg overflow-hidden border border-border/50">
            <div className="bg-muted/50 px-3 py-1 text-xs text-muted-foreground flex items-center gap-2">
              <Code2 className="w-3 h-3" />
              Code
            </div>
            <pre className="bg-muted p-3 overflow-x-auto text-xs">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      
      // Format bullet points
      const lines = part.split('\n');
      return (
        <div key={i}>
          {lines.map((line, j) => {
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
              return (
                <div key={j} className="flex gap-2 my-1">
                  <span className="text-primary mt-1">•</span>
                  <span>{line.replace(/^[\-\*]\s/, '')}</span>
                </div>
              );
            }
            if (line.trim().match(/^\d+\.\s/)) {
              return (
                <div key={j} className="flex gap-2 my-1">
                  <span className="text-primary font-semibold">{line.match(/^\d+\./)?.[0]}</span>
                  <span>{line.replace(/^\d+\.\s/, '')}</span>
                </div>
              );
            }
            return line ? <p key={j} className="my-1">{line}</p> : <br key={j} />;
          })}
        </div>
      );
    });
  };

  return (
    <div className="h-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Insights Explorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Ask questions about your form data and get intelligent insights
          </p>
        </div>
        
        {/* Form Selector */}
        <div className="w-64">
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger className="bg-card border-2">
              <SelectValue placeholder="Select a form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  All Forms
                </div>
              </SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{form.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {form.response_count || 0}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {quickActions.map((action, idx) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.query)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover:shadow-2xl border border-border/50"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-[0.07] group-hover:opacity-[0.15] transition-all duration-300`} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">{action.label}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{action.query}</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl -mr-12 -mt-12" />
            </button>
          ))}
        </div>
      )}

      {/* Chat Interface */}
      <Card className="flex-1 border-2 shadow-2xl animate-scale-in">
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <span className="text-lg">AI Conversation</span>
              <p className="text-xs text-muted-foreground font-normal">Powered by advanced AI</p>
            </div>
            {selectedForm !== "all" && (
              <Badge variant="secondary" className="ml-auto px-3 py-1">
                {forms.find(f => f.id === selectedForm)?.title || "Unknown Form"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-[calc(100vh-400px)]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                    <MessageSquare className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Start exploring your data
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
                  Use the quick actions above or type your own question to get AI-powered insights
                  from your form responses
                </p>
                <div className="space-y-3 text-sm text-muted-foreground max-w-lg">
                  <p className="font-semibold text-foreground flex items-center gap-2 justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Example questions:
                  </p>
                  <div className="grid gap-2">
                    <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      "How many responses were submitted this month?"
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      "What's the average rating for customer satisfaction?"
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      "Show me all responses on a map"
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl shadow-lg ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary via-purple-500 to-purple-600 text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {message.role === "assistant" && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm leading-relaxed">
                              {formatContent(message.content)}
                            </div>
                            
                            {/* Stats Display */}
                            {message.stats && (
                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                  <div className="text-xs text-muted-foreground mb-1">Total Responses</div>
                                  <div className="text-2xl font-bold text-primary">{message.stats.total}</div>
                                </div>
                                {message.stats.avg_rating && (
                                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <div className="text-xs text-muted-foreground mb-1">Avg Rating</div>
                                    <div className="text-2xl font-bold text-amber-600 flex items-center gap-1">
                                      {message.stats.avg_rating.toFixed(1)}
                                      <Star className="w-4 h-4" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Map Display */}
                            {message.mapData && (
                              <div className="mt-4 rounded-xl overflow-hidden border-2 border-border shadow-lg">
                                <div className="bg-muted/50 px-3 py-2 flex items-center justify-between border-b">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    {message.mapData.features.length} locations
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        const geoJson = {
                                          type: "FeatureCollection",
                                          features: message.mapData!.features.map(f => ({
                                            type: "Feature",
                                            geometry: {
                                              type: "Point",
                                              coordinates: [f.lng, f.lat]
                                            },
                                            properties: f.properties || {}
                                          }))
                                        };
                                        const dataStr = JSON.stringify(geoJson, null, 2);
                                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                                        const exportFileDefaultName = `ai-insights-${new Date().getTime()}.geojson`;
                                        const linkElement = document.createElement('a');
                                        linkElement.setAttribute('href', dataUri);
                                        linkElement.setAttribute('download', exportFileDefaultName);
                                        linkElement.click();
                                        toast({
                                          title: "Map exported",
                                          description: "GeoJSON file downloaded successfully",
                                        });
                                      }}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      GeoJSON
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        const mapElement = document.querySelector('.leaflet-container');
                                        if (mapElement) {
                                          import('html2canvas').then((html2canvas) => {
                                            html2canvas.default(mapElement as HTMLElement).then((canvas) => {
                                              const link = document.createElement('a');
                                              link.download = `ai-insights-map-${new Date().getTime()}.png`;
                                              link.href = canvas.toDataURL();
                                              link.click();
                                              toast({
                                                title: "Screenshot saved",
                                                description: "Map image downloaded successfully",
                                              });
                                            });
                                          }).catch(() => {
                                            toast({
                                              variant: "destructive",
                                              title: "Export failed",
                                              description: "Please use browser screenshot instead",
                                            });
                                          });
                                        }
                                      }}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Image
                                    </Button>
                                  </div>
                                </div>
                                <MapContainer
                                  center={message.mapData.center}
                                  zoom={message.mapData.zoom}
                                  style={{ height: "400px", width: "100%" }}
                                  className="z-0"
                                >
                                  <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                  />
                                  {message.mapData.features.map((feature, i) => (
                                    <CircleMarker
                                      key={i}
                                      center={[feature.lat, feature.lng]}
                                      radius={8}
                                      pathOptions={{
                                        fillColor: "#8b5cf6",
                                        fillOpacity: 0.6,
                                        color: "#6d28d9",
                                        weight: 2
                                      }}
                                    >
                                      <Popup>
                                        <div className="text-sm">
                                          {Object.entries(feature.properties || {}).map(([key, value]) => (
                                            <div key={key} className="mb-1">
                                              <span className="font-semibold">{key}:</span> {String(value)}
                                            </div>
                                          ))}
                                        </div>
                                      </Popup>
                                    </CircleMarker>
                                  ))}
                                </MapContainer>
                              </div>
                            )}
                            
                            <p className={`text-xs mt-3 flex items-center gap-2 ${
                              message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              <span>{formatTime(message.timestamp)}</span>
                              {message.mapData && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {message.mapData.features.length} locations
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-medium">Analyzing your data</span>
                          <p className="text-xs text-muted-foreground">This may take a few moments...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-5 bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your form data..."
                  className="min-h-[70px] max-h-[140px] resize-none pr-10 border-2 focus:border-primary/50 transition-colors"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {input.length}/500
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading || !input.trim()}
                size="icon"
                className="h-[70px] w-[70px] rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 hover:scale-105 hover:shadow-xl transition-all shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </Button>
            </form>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs">Enter</kbd> to send
              </p>
              <p className="text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs">Enter</kbd> for new line
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsightsView;
