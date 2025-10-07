import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building, Shield, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FieldProfile = () => {
  const { user } = useAuth();
  const { roles } = useRole();
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user?.organisation_id) {
        setLoadingOrg(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("organisations")
          .select("name")
          .eq("id", user.organisation_id)
          .single();

        if (error) throw error;
        setOrganizationName(data?.name || null);
      } catch (error) {
        console.error("Error fetching organization:", error);
      } finally {
        setLoadingOrg(false);
      }
    };

    fetchOrganization();
  }, [user?.organisation_id]);

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Profile</h2>
            <p className="text-sm text-muted-foreground">Your account information</p>
          </div>
        </div>
      </div>

      {/* User Information Card */}
      <Card className="group relative overflow-hidden border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-secondary flex items-center justify-center text-white text-3xl font-heading font-bold shadow-[var(--shadow-glow)]">
                {user?.full_name?.[0] || user?.email?.[0] || "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-card shadow-lg"></div>
            </div>
            <div className="flex-1">
              <p className="font-heading font-bold text-xl text-foreground">{user?.full_name || "User"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs font-semibold">
                      {role.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Organization</p>
                {loadingOrg ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {organizationName || "Not assigned"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Information Card */}
      <Card className="border-0 shadow-[var(--shadow-card)] animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="text-lg">App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground font-medium">Version</span>
            <Badge variant="outline" className="font-mono">1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground font-medium">Mode</span>
            <Badge className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
              Field Staff
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldProfile;
