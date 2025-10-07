import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Map, LogOut } from "lucide-react";
import { SyncStatus } from "@/components/SyncStatus";
import { FormsList } from "@/components/forms/FormsList";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAnalyst, isAdmin } = useRole();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

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
          <div className="flex items-center gap-3">
            <SyncStatus />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Field Staff View */}
      <main className="container mx-auto px-4 py-8">
        <FormsList showHeader={true} />
      </main>
    </div>
  );
};

export default Dashboard;
