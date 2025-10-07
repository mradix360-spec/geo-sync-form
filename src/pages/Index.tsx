import { Button } from "@/components/ui/button";
import { Map, FormInput, Database, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-primary to-primary-glow mb-8 shadow-[var(--shadow-glow)]">
            <Map className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            GeoSync Forms
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Professional field data collection platform with PostGIS storage, offline PWA support, and QGIS integration
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth/register")}
              className="shadow-[var(--shadow-glow)]"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth/login")}
            >
              Sign In
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg bg-card border border-border shadow-[var(--shadow-card)]">
              <FormInput className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Dynamic Forms</h3>
              <p className="text-sm text-muted-foreground">Create custom forms with multiple field types and validations</p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-[var(--shadow-card)]">
              <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">PostGIS Storage</h3>
              <p className="text-sm text-muted-foreground">Store data as GeoJSON with full spatial indexing support</p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-[var(--shadow-card)]">
              <Share2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">QGIS Ready</h3>
              <p className="text-sm text-muted-foreground">Export to GeoJSON for seamless QGIS integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
