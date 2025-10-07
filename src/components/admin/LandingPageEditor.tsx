import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LandingPageEditor() {
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#8B5CF6");
  const [overlayStyle, setOverlayStyle] = useState<'gradient' | 'solid' | 'radial' | 'none'>('gradient');
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [ctaText, setCtaText] = useState("Get Started");
  const [features, setFeatures] = useState<string[]>(["", "", ""]);
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisations")
        .select("landing_config, slug, is_landing_enabled")
        .eq("id", currentUser?.organisation_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  useEffect(() => {
    if (organization) {
      const config = organization.landing_config as any;
      setTitle(config?.title || "");
      setDescription(config?.description || "");
      setLogoUrl(config?.logo_url || "");
      setBannerUrl(config?.banner_url || "");
      setPrimaryColor(config?.primary_color || "#3B82F6");
      setSecondaryColor(config?.secondary_color || "#8B5CF6");
      setOverlayStyle(config?.overlay_style || 'gradient');
      setOverlayOpacity(typeof config?.overlay_opacity === 'number' ? config.overlay_opacity : 0.7);
      setOverlayColor(config?.overlay_color || '#000000');
      setCtaText(config?.cta_text || "Get Started");
      setFeatures(config?.features || ["", "", ""]);
      setSlug(organization.slug || "");
      setIsEnabled(organization.is_landing_enabled || false);
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const config = {
        title,
        description,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        overlay_style: overlayStyle,
        overlay_opacity: overlayOpacity,
        overlay_color: overlayColor,
        cta_text: ctaText,
        features: features.filter(f => f.trim() !== ""),
      };

      const { error } = await supabase
        .from("organisations")
        .update({ 
          landing_config: config,
          slug,
          is_landing_enabled: isEnabled
        })
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

  const landingUrl = slug ? `${window.location.origin}/org/${slug}` : "";

  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#','');
    const bigint = parseInt(clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };

  const getOverlayStyle = () => {
    if (overlayStyle === 'none') return 'transparent';
    const { r, g, b } = hexToRgb(overlayColor || '#000000');
    const a = Math.max(0, Math.min(1, overlayOpacity));
    switch (overlayStyle) {
      case 'solid':
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      case 'radial':
        return `radial-gradient(circle at center, transparent 0%, rgba(${r}, ${g}, ${b}, ${a}) 100%)`;
      case 'gradient':
      default:
        return `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, ${a}), rgba(${r}, ${g}, ${b}, ${Math.max(0, a * 0.5)}), transparent)`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Status</CardTitle>
          <CardDescription>
            Enable or disable your organization's public landing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-enabled">Landing Page Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Make your custom landing page publicly accessible
              </p>
            </div>
            <Switch
              id="is-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
          {isEnabled && slug && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Your Landing Page URL:</p>
              <a 
                href={landingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {landingUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Editor</CardTitle>
            <CardDescription>
              Customize your organization's public landing page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="your-org-name"
                />
                <p className="text-xs text-muted-foreground">
                  Your landing page URL: /org/{slug || "your-slug"}
                </p>
              </div>

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
                  placeholder="Enter a welcome message"
                  rows={3}
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

              <div className="space-y-2">
                <Label htmlFor="bannerUrl">Banner Image URL</Label>
                <Input
                  id="bannerUrl"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overlayStyle">Banner Overlay Style</Label>
                  <select
                    id="overlayStyle"
                    value={overlayStyle}
                    onChange={(e) => setOverlayStyle(e.target.value as any)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="gradient">Gradient</option>
                    <option value="solid">Solid</option>
                    <option value="radial">Radial</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overlayColor">Overlay Color</Label>
                  <Input
                    id="overlayColor"
                    type="color"
                    value={overlayColor}
                    onChange={(e) => setOverlayColor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overlayOpacity">Overlay Opacity (0 - 1)</Label>
                  <Input
                    id="overlayOpacity"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">Login Button Text</Label>
                <Input
                  id="ctaText"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Get Started"
                />
              </div>

              <div className="space-y-2">
                <Label>Key Features (3 items)</Label>
                {features.map((feature, index) => (
                  <Input
                    key={index}
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...features];
                      newFeatures[index] = e.target.value;
                      setFeatures(newFeatures);
                    }}
                    placeholder={`Feature ${index + 1}`}
                  />
                ))}
              </div>

              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
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
            <div className="border rounded-lg overflow-hidden bg-background">
              {bannerUrl && (
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${bannerUrl})` }}
                >
                  <div className="absolute inset-0" style={{ background: getOverlayStyle() }} />
                  <div className="absolute inset-0 backdrop-blur-[2px]" />
                </div>
              )}
              <div className="p-6 space-y-4">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Organization Logo"
                    className="h-12 object-contain"
                  />
                )}
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {title || "Your Organization Title"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {description || "Your organization description will appear here"}
                </p>
                {features.filter(f => f.trim()).length > 0 && (
                  <div className="grid gap-2 pt-2">
                    {features.filter(f => f.trim()).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: secondaryColor }}
                        />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  className="w-full mt-4"
                  style={{ backgroundColor: primaryColor }}
                >
                  {ctaText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
