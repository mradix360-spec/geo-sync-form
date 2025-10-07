import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building, Shield } from "lucide-react";

const FieldProfile = () => {
  const { user } = useAuth();
  const { roles } = useRole();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Profile</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.[0] || user?.email?.[0] || "U"}
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.full_name || "User"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Roles:</span>
              <div className="flex gap-1">
                {roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Organization:</span>
              <span>{user?.organisation_id ? "Assigned" : "Not assigned"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode:</span>
            <Badge variant="outline">Field Staff</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldProfile;
