import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Loader2 } from "lucide-react";

interface AnalystRouteProps {
  children: React.ReactNode;
}

export const AnalystRoute = ({ children }: AnalystRouteProps) => {
  const { user, loading } = useAuth();
  const { isAnalyst, isAdmin } = useRole();

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

  if (!isAnalyst() && !isAdmin()) {
    return <Navigate to="/field" replace />;
  }

  return <>{children}</>;
};
