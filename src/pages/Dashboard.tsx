import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Plus, LogOut, FormInput, MapPin, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Form {
  id: string;
  title: string;
  description: string;
  geometry_type: string;
  is_published: boolean;
  created_at: string;
  response_count?: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadForms();
  }, [user, navigate]);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          form_responses(count)
        `)
        .eq("organisation_id", user?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formsWithCount = data?.map(form => ({
        ...form,
        response_count: form.form_responses?.[0]?.count || 0,
      })) || [];

      setForms(formsWithCount);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading forms",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">GeoSync Forms</h1>
              <p className="text-sm text-muted-foreground">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Forms</h2>
            <p className="text-muted-foreground mt-1">Create and manage field data collection forms</p>
          </div>
          <Button onClick={() => navigate("/form-builder")} size="lg" className="shadow-[var(--shadow-glow)]">
            <Plus className="w-5 h-5 mr-2" />
            Create Form
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FormInput className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first form to start collecting field data
              </p>
              <Button onClick={() => navigate("/form-builder")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-[var(--shadow-glow)] transition-all cursor-pointer" onClick={() => navigate(`/form/${form.id}/map`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <Badge variant={form.is_published ? "default" : "secondary"}>
                      {form.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {form.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{form.geometry_type || "No geometry"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FormInput className="w-4 h-4" />
                    <span>{form.response_count || 0} responses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(form.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/form/${form.id}/submit`);
                  }}>
                    <Plus className="w-3 h-3 mr-1" />
                    Submit
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/form/${form.id}/map`);
                  }}>
                    <Map className="w-3 h-3 mr-1" />
                    View Map
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
