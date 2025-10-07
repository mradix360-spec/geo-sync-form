import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Loader2 } from "lucide-react";

export const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  const { isFieldUser, isAnalyst, isAdmin } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect based on role
  if (isFieldUser()) {
    return <Navigate to="/field" replace />;
  }

  if (isAnalyst() || isAdmin()) {
    return <Navigate to="/analyst" replace />;
  }

  // Fallback to login if no valid role
  return <Navigate to="/auth/login" replace />;
};
