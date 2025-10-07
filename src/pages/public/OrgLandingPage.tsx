import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, ArrowRight, Sparkles, Zap, Shield, Users, FileText, Map, BarChart3 } from "lucide-react";

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
  const [publicForms, setPublicForms] = useState<any[]>([]);
  const [publicMaps, setPublicMaps] = useState<any[]>([]);
  const [publicDashboards, setPublicDashboards] = useState<any[]>([]);

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
        
        // Fetch public content
        const [formsRes, mapsRes, dashboardsRes] = await Promise.all([
          supabase
            .from("forms")
            .select("id, title, description")
            .eq("organisation_id", data.id)
            .eq("is_published", true)
            .limit(3),
          supabase
            .from("maps")
            .select("id, title, description")
            .eq("organisation_id", data.id)
            .limit(3),
          supabase
            .from("dashboards")
            .select("id, title, description")
            .eq("organisation_id", data.id)
            .eq("is_public", true)
            .limit(3)
        ]);

        if (formsRes.data) setPublicForms(formsRes.data);
        if (mapsRes.data) setPublicMaps(mapsRes.data);
        if (dashboardsRes.data) setPublicDashboards(dashboardsRes.data);

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

  const defaultIcons = [Zap, Shield, Users];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ backgroundColor: primaryColor }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ backgroundColor: secondaryColor, animationDelay: '1s' }}
        />
      </div>

      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {config.banner_url ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${config.banner_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
        )}
        
        <div className="relative container mx-auto px-4 py-20 z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            {config.logo_url && (
              <div className="flex justify-center mb-8 animate-scale-in">
                <img
                  src={config.logo_url}
                  alt={org.name}
                  className="h-20 md:h-28 w-auto object-contain drop-shadow-2xl"
                />
              </div>
            )}
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
              <span className="text-sm font-medium" style={{ color: primaryColor }}>
                Modern Data Collection Platform
              </span>
            </div>

            <h1 
              className={`text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight ${
                config.banner_url ? 'text-white' : ''
              }`}
              style={!config.banner_url ? { 
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              } : {}}
            >
              {config.title || org.name}
            </h1>

            <p className={`text-xl md:text-2xl lg:text-3xl max-w-3xl mx-auto leading-relaxed ${
              config.banner_url ? 'text-white/90' : 'text-muted-foreground'
            }`}>
              {config.description || `Welcome to ${org.name}`}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to={`/org/${slug}/login`}>
                <Button 
                  size="lg"
                  className="text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
                  style={{ backgroundColor: primaryColor }}
                >
                  {config.cta_text || "Get Started"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
                <div 
                  className="w-1.5 h-3 rounded-full mt-2 animate-pulse"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {features.length > 0 && (
        <section className="py-24 px-4 relative">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Why Choose Us
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features that set us apart from the competition
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = defaultIcons[index % defaultIcons.length];
                return (
                  <Card 
                    key={index}
                    className="group p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 relative overflow-hidden"
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      }}
                    />
                    <div className="relative z-10 space-y-4">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: `${secondaryColor}20` }}
                      >
                        <IconComponent 
                          className="h-7 w-7"
                          style={{ color: secondaryColor }}
                        />
                      </div>
                      <h3 className="text-xl font-bold">{feature}</h3>
                      <CheckCircle2 
                        className="h-5 w-5 opacity-50"
                        style={{ color: primaryColor }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Public Content Showcase */}
      {(publicForms.length > 0 || publicMaps.length > 0 || publicDashboards.length > 0) && (
        <section className="py-24 px-4 relative">
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}08 100%)`
            }}
          />
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Explore Our Resources
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover our collection of forms, maps, and dashboards
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Forms */}
              {publicForms.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <FileText className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="text-2xl font-bold">Forms</h3>
                  </div>
                  <div className="space-y-3">
                    {publicForms.map((form, idx) => (
                      <Card 
                        key={form.id}
                        className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
                        style={{ 
                          animationDelay: `${idx * 100}ms`,
                          animation: 'fade-in 0.5s ease-out forwards'
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">{form.title}</h4>
                        {form.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {form.description}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Maps */}
              {publicMaps.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${secondaryColor}20` }}
                    >
                      <Map className="h-6 w-6" style={{ color: secondaryColor }} />
                    </div>
                    <h3 className="text-2xl font-bold">Maps</h3>
                  </div>
                  <div className="space-y-3">
                    {publicMaps.map((map, idx) => (
                      <Card 
                        key={map.id}
                        className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
                        style={{ 
                          animationDelay: `${idx * 100 + 100}ms`,
                          animation: 'fade-in 0.5s ease-out forwards'
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">{map.title}</h4>
                        {map.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {map.description}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Dashboards */}
              {publicDashboards.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`
                      }}
                    >
                      <BarChart3 
                        className="h-6 w-6" 
                        style={{ color: primaryColor }}
                      />
                    </div>
                    <h3 className="text-2xl font-bold">Dashboards</h3>
                  </div>
                  <div className="space-y-3">
                    {publicDashboards.map((dashboard, idx) => (
                      <Card 
                        key={dashboard.id}
                        className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
                        style={{ 
                          animationDelay: `${idx * 100 + 200}ms`,
                          animation: 'fade-in 0.5s ease-out forwards'
                        }}
                      >
                        <h4 className="font-semibold text-lg mb-2">{dashboard.title}</h4>
                        {dashboard.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {dashboard.description}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <Card className="relative overflow-hidden border-2 p-12 md:p-16 text-center">
            <div 
              className="absolute inset-0 opacity-10"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
              }}
            />
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of teams already using our platform to streamline their data collection
              </p>
              <Link to={`/org/${slug}/login`}>
                <Button 
                  size="lg"
                  className="text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group mt-6"
                  style={{ backgroundColor: primaryColor }}
                >
                  {config.cta_text || "Start Now"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="py-12 px-4 border-t bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {config.logo_url && (
              <img
                src={config.logo_url}
                alt={org.name}
                className="h-8 w-auto object-contain opacity-60"
              />
            )}
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {org.name}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
