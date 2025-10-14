import { Button } from "@/components/ui/button";
import { Map, MapPin, Database, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      const isFieldStaff = user.roles.includes('field_staff');
      const redirectPath = isFieldStaff ? '/field' : '/analyst';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-6">
            <Map className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            GeoSync Forms
          </h1>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Enterprise field data collection with spatial database integration
          </p>

          <div className="flex gap-4 justify-center mb-20">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth/register")}
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

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-8 rounded-lg bg-card border hover:border-primary/50 transition-colors">
              <MapPin className="w-10 h-10 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Spatial Data Collection</h3>
              <p className="text-sm text-muted-foreground">Capture location-based data with precision mapping and geometry tools</p>
            </div>
            <div className="p-8 rounded-lg bg-card border hover:border-primary/50 transition-colors">
              <Database className="w-10 h-10 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">PostGIS Integration</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade spatial database with full GIS capabilities</p>
            </div>
            <div className="p-8 rounded-lg bg-card border hover:border-primary/50 transition-colors">
              <BarChart3 className="w-10 h-10 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Real-time Analytics</h3>
              <p className="text-sm text-muted-foreground">Visualize and analyze field data with interactive dashboards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
