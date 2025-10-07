import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAnalyst, isAdmin, isFieldUser } = useRole();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Route based on role
    if (isFieldUser()) {
      navigate("/field");
    } else if (isAnalyst() || isAdmin()) {
      navigate("/dashboard/forms");
    } else {
      // Fallback to auth if no valid role
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Dashboard;
