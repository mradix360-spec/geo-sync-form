import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

interface OrgConfig {
  id: string;
  name: string;
  slug: string;
  is_landing_enabled: boolean;
  landing_config: {
    title: string;
    description: string;
    logo_url?: string;
    banner_url?: string;
    primary_color?: string;
    secondary_color?: string;
    cta_text?: string;
    features?: string[];
  };
}

export default function OrgLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<OrgConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const { data, error } = await supabase
          .from("organisations")
          .select("id, name, slug, is_landing_enabled, landing_config")
          .eq("slug", slug)
          .single();

        if (error) throw error;

        if (!data.is_landing_enabled) {
          setError("This landing page is not currently available.");
          return;
        }

        setOrg(data as OrgConfig);
      } catch (err) {
        console.error("Error fetching organization:", err);
        setError("Organization not found");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  const config = org.landing_config;
  const primaryColor = config.primary_color || "#3B82F6";
  const secondaryColor = config.secondary_color || "#8B5CF6";
  const features = config.features?.filter(f => f.trim()) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Banner */}
      <section className="relative">
        {config.banner_url ? (
          <div 
            className="h-[500px] bg-cover bg-center relative"
            style={{ backgroundImage: `url(${config.banner_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
              {config.logo_url && (
                <img
                  src={config.logo_url}
                  alt={org.name}
                  className="h-24 w-auto object-contain mb-8 drop-shadow-lg"
                />
              )}
              <h1 
                className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg"
              >
                {config.title || org.name}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mb-8 drop-shadow">
                {config.description || `Welcome to ${org.name}`}
              </p>
              <Link to={`/org/${slug}/login`}>
                <Button 
                  size="lg"
                  className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  {config.cta_text || "Get Started"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div 
            className="py-20 px-4 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}20 0%, ${secondaryColor}20 100%)`
            }}
          >
            {config.logo_url && (
              <img
                src={config.logo_url}
                alt={org.name}
                className="h-20 w-auto object-contain mx-auto mb-6"
              />
            )}
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: primaryColor }}
            >
              {config.title || org.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {config.description || `Welcome to ${org.name}`}
            </p>
            <Link to={`/org/${slug}/login`}>
              <Button 
                size="lg"
                style={{ backgroundColor: primaryColor }}
              >
                {config.cta_text || "Get Started"}
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      {features.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose Us
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${secondaryColor}20` }}
                    >
                      <CheckCircle2 
                        className="h-6 w-6"
                        style={{ color: secondaryColor }}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-medium">{feature}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section 
        className="py-16 px-4"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%)`
        }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sign in to access your account and start using our platform
          </p>
          <Link to={`/org/${slug}/login`}>
            <Button 
              size="lg"
              style={{ backgroundColor: primaryColor }}
            >
              {config.cta_text || "Sign In Now"}
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {org.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
