import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useForms } from "@/hooks/use-forms";

interface CreateCustomWidgetDialogProps {
  onWidgetCreated?: () => void;
}

export const CreateCustomWidgetDialog = ({ onWidgetCreated }: CreateCustomWidgetDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { forms } = useForms();

  const handleCreate = async () => {
    if (!name.trim() || !prompt.trim() || !user?.organisation_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name and widget description are required",
      });
      return;
    }

    try {
      setLoading(true);

      // Call edge function to create custom widget using AI
      const { data, error } = await supabase.functions.invoke(
        "natural-language-dashboard",
        {
          body: {
            query: `Create a single custom widget named "${name}". ${prompt}`,
            userId: user.id,
            orgId: user.organisation_id,
            formIds: forms?.map(f => f.id) || [],
            createSingleWidget: true,
          },
        }
      );

      if (error) throw error;

      if (!data?.widgets?.[0]) {
        throw new Error("Failed to generate widget configuration");
      }

      const widget = data.widgets[0];

      // Save to custom_widgets table
      const { error: insertError } = await supabase
        .from("custom_widgets")
        .insert({
          organisation_id: user.organisation_id,
          name: name.trim(),
          description: description.trim() || prompt.trim(),
          widget_type: widget.type,
          config: widget.config,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Custom Widget Created",
        description: `"${name}" is now available in your widget library`,
      });

      setOpen(false);
      setName("");
      setDescription("");
      setPrompt("");
      onWidgetCreated?.();
    } catch (error: any) {
      console.error("Error creating custom widget:", error);
      toast({
        variant: "destructive",
        title: "Error creating widget",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          Create Custom Widget with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Custom Widget</DialogTitle>
          <DialogDescription>
            Describe the widget you want and AI will create it for you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Widget Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Water Quality Tracker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Input
              id="description"
              placeholder="Brief description of the widget"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">What should this widget show? *</Label>
            <Textarea
              id="prompt"
              placeholder="Describe what data to display and how. E.g., 'Show average pH levels by location as a bar chart' or 'Display a map of all water samples with color-coded quality levels'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              rows={4}
            />
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
          <Button onClick={handleCreate} disabled={loading || !name.trim() || !prompt.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? "Creating..." : "Create Widget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
