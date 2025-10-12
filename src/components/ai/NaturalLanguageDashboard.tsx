import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const NaturalLanguageDashboard = () => {
  const [step, setStep] = useState<"select" | "prompt">("select");
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load available forms on mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        const { data: forms } = await supabase
          .from('forms')
          .select('id, title, description, schema')
          .eq('organisation_id', user?.organisation_id)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (forms) {
          const formsWithCounts = await Promise.all(
            forms.map(async (form) => {
              const { count } = await supabase
                .from('form_responses')
                .select('*', { count: 'exact', head: true })
                .eq('form_id', form.id);
              
              return { ...form, response_count: count || 0 };
            })
          );
          setAvailableForms(formsWithCounts.filter(f => f.response_count > 0));
        }
      } catch (error) {
        console.error("Failed to load forms:", error);
        toast({
          title: "Error loading forms",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadForms();
  }, [user?.organisation_id]);

  const generateDashboard = async () => {
    if (!query.trim() || selectedForms.length === 0) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("natural-language-dashboard", {
        body: { 
          query,
          userId: user?.id,
          orgId: user?.organisation_id,
          formIds: selectedForms
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

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading forms...</p>
        </div>
      </Card>
    );
  }

  if (step === "select") {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Dashboard Builder</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Step 1: Select Form Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which forms to analyze. AI will generate insights based on your selection.
            </p>
          </div>

          {availableForms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No forms with responses available.</p>
              <p className="text-sm">Create and publish forms to use this feature.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableForms.map((form) => (
                <label
                  key={form.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selectedForms.includes(form.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedForms([...selectedForms, form.id]);
                      } else {
                        setSelectedForms(selectedForms.filter(id => id !== form.id));
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{form.title}</p>
                    {form.description && (
                      <p className="text-sm text-muted-foreground">{form.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.response_count} responses • {form.schema?.fields?.length || 0} fields
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <Button
            onClick={() => setStep("prompt")}
            disabled={selectedForms.length === 0}
            className="w-full"
          >
            Continue to AI Prompt
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Dashboard Builder</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Step 2: Describe Your Dashboard</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Selected {selectedForms.length} form(s). Tell AI what insights you want to see.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("select")}
          >
            Change Selection
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g., Show me trends, urgent issues, completion rates..."
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
      </div>
    </Card>
  );
};
