import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { FileText, Database, User, LogOut } from "lucide-react";
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
    { path: "/field/offline", icon: Database, label: "Offline" },
    { path: "/field/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Modern Mobile Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-glow to-secondary flex items-center justify-center shadow-[var(--shadow-glow)] animate-scale-in">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground tracking-tight">GeoSync</h1>
              <p className="text-xs text-muted-foreground font-medium">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncStatus />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg z-50">
        <div className="grid grid-cols-3 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group relative flex flex-col items-center justify-center py-3 px-3 rounded-xl transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-br from-primary to-secondary text-white shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                }`}
              >
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl opacity-20 blur-xl"></div>
                )}
                <Icon className={`w-6 h-6 mb-1 transition-transform ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className={`text-xs font-semibold ${active ? 'font-bold' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default FieldStaffLayout;
