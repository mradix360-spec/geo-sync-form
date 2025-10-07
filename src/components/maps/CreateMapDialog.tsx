import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface CreateMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateMapDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateMapDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shareType: "private",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Create map with default config
      const { data: mapData, error: mapError } = await supabase
        .from("maps")
        .insert({
          title: formData.title,
          description: formData.description,
          organisation_id: user.organisation_id,
          created_by: user.id,
          config: {
            viewport: { center: [0, 20], zoom: 3 },
            layers: [],
          },
        })
        .select()
        .single();

      if (mapError) throw mapError;

      // Create share record if not private
      if (formData.shareType !== "private") {
        const { error: shareError } = await supabase.from("shares").insert({
          object_id: mapData.id,
          object_type: "map",
          access_type: formData.shareType,
          organisation_id: user.organisation_id,
        });

        if (shareError) throw shareError;
      }

      toast({
        title: "Success",
        description: "Map created successfully",
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        shareType: "private",
      });
    } catch (error: any) {
      console.error("Error creating map:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create map",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Map</DialogTitle>
            <DialogDescription>
              Create a new map to visualize your form data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter map title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter map description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shareType">Sharing</Label>
              <Select
                value={formData.shareType}
                onValueChange={(value) =>
                  setFormData({ ...formData, shareType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="organisation">Organisation</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="other_organisation">
                    Other Organisations
                  </SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Control who can view this map
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? "Creating..." : "Create Map"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
