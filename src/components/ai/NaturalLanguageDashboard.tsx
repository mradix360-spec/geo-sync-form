import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const NaturalLanguageDashboard = () => {
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const suggestions = [
    "Show me top 5 issues by region this month",
    "Create a dashboard for infrastructure inspections",
    "Display urgent submissions from the last 7 days",
    "Show completion rates by user",
  ];

  const generateDashboard = async () => {
    if (!query.trim()) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("natural-language-dashboard", {
        body: { 
          query,
          userId: user?.id,
          orgId: user?.organisation_id
        },
      });

      if (error) throw error;

      // Save dashboard to database
      const { data: dashboard, error: saveError } = await supabase
        .from("dashboards")
        .insert({
          title: data.title,
          description: data.description,
          config: { widgets: data.widgets },
          created_by: user?.id,
          organisation_id: user?.organisation_id,
          is_public: false,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: "Dashboard created! 🎉",
        description: data.title,
      });

      // Navigate to the new dashboard
      navigate(`/dashboard/${dashboard.id}`);
    } catch (error: any) {
      console.error("Dashboard generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Dashboard Builder</h2>
      </div>

      <p className="text-muted-foreground">
        Describe the dashboard you want in plain English, and AI will create it for you.
      </p>

      <div className="flex gap-2">
        <Input
          placeholder="e.g., Show me all urgent issues from the last week..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generateDashboard()}
          disabled={generating}
        />
        <Button
          onClick={generateDashboard}
          disabled={generating || !query.trim()}
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => setQuery(suggestion)}
              disabled={generating}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};
