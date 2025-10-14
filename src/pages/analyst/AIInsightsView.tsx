import { useState, useEffect } from "react";
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
  Send
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useForms } from "@/hooks/use-forms";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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

  const quickActions: QuickAction[] = [
    {
      label: "Last 7 Days",
      query: "Show me all responses from the last 7 days with a summary",
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      label: "Low Ratings",
      query: "Show me responses with ratings below 3 stars and explain the patterns",
      icon: Star,
      gradient: "from-orange-500 to-red-500"
    },
    {
      label: "Response Trends",
      query: "Analyze response trends over time and highlight any unusual patterns",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      label: "Summary Stats",
      query: "Give me a comprehensive summary of all form responses with key statistics",
      icon: BarChart3,
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  const handleQuickAction = (query: string) => {
    setInput(query);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-responses", {
        body: { 
          query: userMessage.content,
          messages: [...messages, userMessage],
          formId: selectedForm !== "all" ? selectedForm : undefined
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error analyzing responses:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Failed to analyze form responses",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.query)}
              className="group relative overflow-hidden rounded-xl p-6 text-left transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{action.label}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{action.query}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chat Interface */}
      <Card className="flex-1 border-2">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>Conversation</span>
            {selectedForm !== "all" && (
              <Badge variant="secondary" className="ml-auto">
                {forms.find(f => f.id === selectedForm)?.title || "Unknown Form"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-[calc(100vh-400px)]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start exploring your data</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Use the quick actions above or type your own question to get AI-powered insights
                  from your form responses
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Example questions:</p>
                  <p>"How many responses were submitted this month?"</p>
                  <p>"What's the average rating for customer satisfaction?"</p>
                  <p>"Show me responses with negative feedback"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary to-purple-500 text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {message.role === "assistant" && (
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-card">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your form data..."
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button 
                type="submit" 
                disabled={loading || !input.trim()}
                size="icon"
                className="h-[60px] w-[60px] bg-gradient-to-br from-primary to-purple-500 hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsightsView;
