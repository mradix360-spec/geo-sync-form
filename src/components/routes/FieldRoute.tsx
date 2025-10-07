import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Loader2 } from "lucide-react";

interface FieldRouteProps {
  children: React.ReactNode;
}

export const FieldRoute = ({ children }: FieldRouteProps) => {
  const { user, loading } = useAuth();
  const { isFieldUser } = useRole();

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

  if (!isFieldUser()) {
    return <Navigate to="/analyst" replace />;
  }

  return <>{children}</>;
};
