import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { FileText, Map, User, LogOut } from "lucide-react";
import { SyncStatus } from "@/components/SyncStatus";
import { Button } from "@/components/ui/button";
import { syncService } from "@/lib/syncService";

const FieldStaffLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isFieldUser } = useRole();

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    // Redirect if not field staff
    const hasAccess = isFieldUser();
    if (!hasAccess) {
      navigate("/analyst");
    }

    // Initialize auto-sync
    syncService.startAutoSync();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const navItems = [
    { path: "/field", icon: FileText, label: "Forms" },
    { path: "/field/map", icon: Map, label: "Map" },
    { path: "/field/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">GeoSync</h1>
              <p className="text-xs text-muted-foreground">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncStatus />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="grid grid-cols-3 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default FieldStaffLayout;
