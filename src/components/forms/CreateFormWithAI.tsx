import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export const CreateFormWithAI = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const examplePrompts = [
    "Create a customer satisfaction survey with rating scales and feedback",
    "Build a water quality monitoring form with pH, temperature, and location",
    "Design an incident report form for workplace safety",
    "Make a community feedback survey about local services",
    "Create a property inspection checklist with photos"
  ];

  const handleCreate = async () => {
    if (!prompt.trim() || !user?.organisation_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please describe the form you want to create",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "natural-language-form",
        {
          body: {
            prompt: prompt.trim(),
            userId: user.id,
            orgId: user.organisation_id,
          },
        }
      );

      if (error) throw error;

      if (!data || !data.title || !data.fields) {
        throw new Error("Invalid form schema received from AI");
      }

      // Create the form in the database
      const { data: newForm, error: insertError } = await supabase
        .from("forms")
        .insert({
          title: data.title,
          description: data.description || "",
          schema: { fields: data.fields },
          geometry_type: data.geometry_type || null,
          organisation_id: user.organisation_id,
          created_by: user.id,
          status: 'draft',
          is_published: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Form Created Successfully",
        description: `"${data.title}" has been created and is ready to edit`,
      });

      setOpen(false);
      setPrompt("");
      
      // Navigate to form builder to review and customize
      navigate(`/form-builder/${newForm.id}`);
    } catch (error: any) {
      console.error("Error creating form:", error);
      toast({
        variant: "destructive",
        title: "Error creating form",
        description: error.message || "Failed to generate form from AI",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Create Form with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Survey Form with AI</DialogTitle>
          <DialogDescription>
            Describe the survey or form you need, and AI will generate a complete form structure for you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your form *</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Create a water quality survey form that collects pH levels, temperature, turbidity, and sample location with photos"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Example prompts:</Label>
            <div className="space-y-2">
              {examplePrompts.map((example, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => !loading && setPrompt(example)}
                >
                  <p className="text-sm text-muted-foreground">{example}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !prompt.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? "Creating Form..." : "Create Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
