import { Button } from "@/components/ui/button";
import { Map, MapPin, Database, BarChart3, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-5xl mx-auto">
          {/* Hero Section */}
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/20 bg-primary/5">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
            AI-Powered Field Data Platform
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
            GeoSync Forms
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Intelligent spatial data collection powered by AI
          </p>
          
          <p className="text-base text-muted-foreground/80 mb-10 max-w-2xl mx-auto">
            Streamline field operations with AI-driven insights, PostGIS storage, and real-time analytics
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth/register")}
              className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              Get Started
              <Zap className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth/login")}
              className="text-base px-8"
            >
              Sign In
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="group p-8 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Insights</h3>
              <p className="text-sm text-muted-foreground">Natural language queries and automated data analysis with AI-powered dashboards</p>
            </div>
            
            <div className="group p-8 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Spatial Data Collection</h3>
              <p className="text-sm text-muted-foreground">Precision mapping with point, line, and polygon geometry capture</p>
            </div>
            
            <div className="group p-8 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">PostGIS Integration</h3>
              <p className="text-sm text-muted-foreground">Enterprise spatial database with full GIS capabilities and QGIS export</p>
            </div>
            
            <div className="group p-8 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Real-time Analytics</h3>
              <p className="text-sm text-muted-foreground">Interactive dashboards with custom widgets and live data visualization</p>
            </div>
            
            <div className="group p-8 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Offline Capable</h3>
              <p className="text-sm text-muted-foreground">Work without connectivity and sync when back online</p>
            </div>
            
            <div className="group p-8 rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Custom Maps</h3>
              <p className="text-sm text-muted-foreground">Build interactive maps with layers, styling, and spatial filtering</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
