import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  landing_config: {
    title?: string;
    logo_url?: string;
    primary_color?: string;
  };
}

export default function OrgLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [fetchingOrg, setFetchingOrg] = useState(true);

  // Fetch organization info
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const { data, error } = await supabase
          .from("organisations")
          .select("id, name, slug, landing_config")
          .eq("slug", slug)
          .single();

        if (error) throw error;
        setOrgInfo(data as OrgInfo);
      } catch (error) {
        console.error("Error fetching organization:", error);
        toast({
          title: "Error",
          description: "Organization not found",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setFetchingOrg(false);
      }
    };

    fetchOrg();
  }, [slug, navigate, toast]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && orgInfo) {
      // Check if user belongs to this organization
      if (user.organisation_id === orgInfo.id) {
        const isFieldStaff = user.roles?.includes('field_staff');
        const redirectPath = isFieldStaff ? '/field' : '/analyst';
        navigate(redirectPath, { replace: true });
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have access to this organization",
          variant: "destructive",
        });
        navigate(`/org/${slug}`);
      }
    }
  }, [user, orgInfo, navigate, slug, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgInfo) return;

    setIsLoading(true);

    try {
      await login(email, password);
      // Note: redirect happens in useEffect after user state updates
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchingOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orgInfo) return null;

  const config = orgInfo.landing_config;
  const primaryColor = config?.primary_color || "#3B82F6";

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}05 100%)`
      }}
    >
      <div className="w-full max-w-md space-y-4">
        <Link 
          to={`/org/${slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Landing Page
        </Link>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              {config?.logo_url ? (
                <img
                  src={config.logo_url}
                  alt={orgInfo.name}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <MapPin className="h-8 w-8" style={{ color: primaryColor }} />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">Welcome to {orgInfo.name}</CardTitle>
            <CardDescription>
              Sign in to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Contact your administrator for access</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
