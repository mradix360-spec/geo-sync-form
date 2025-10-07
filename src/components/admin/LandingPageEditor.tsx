import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LandingPageEditor() {
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisations")
        .select("landing_config")
        .eq("id", currentUser?.organisation_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  useEffect(() => {
    if (organization?.landing_config) {
      const config = organization.landing_config as any;
      setTitle(config.title || "");
      setDescription(config.description || "");
      setLogoUrl(config.logo_url || "");
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const config = {
        title,
        description,
        logo_url: logoUrl,
      };

      const { error } = await supabase
        .from("organisations")
        .update({ landing_config: config })
        .eq("id", currentUser?.organisation_id);

      if (error) throw error;

      // Log activity
      await supabase.rpc("log_user_activity", {
        p_user_id: currentUser?.id,
        p_action: "update_landing_page",
        p_object_type: "organization",
        p_object_id: currentUser?.organisation_id,
        p_details: config,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast({ title: "Landing page updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update landing page",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Editor</CardTitle>
          <CardDescription>
            Customize the landing page visible to analysts and admins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Welcome to Your Organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a welcome message or organization description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your landing page will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 space-y-4 bg-background">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Organization Logo"
                className="h-16 object-contain"
              />
            )}
            <h1 className="text-3xl font-bold">
              {title || "Your Organization Title"}
            </h1>
            <p className="text-muted-foreground">
              {description || "Your organization description will appear here"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
