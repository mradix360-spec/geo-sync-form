import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { SyncStatus } from "@/components/SyncStatus";
import { FileText, Map, BarChart3, Settings, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const AnalystLayout = () => {
  const { user, logout } = useAuth();
  const { isAnalyst, isAdmin } = useRole();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    // Redirect if not analyst or admin
    const hasAccess = isAnalyst() || isAdmin();
    if (!hasAccess) {
      navigate("/field");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const navItems = [
    { to: "/analyst/forms", icon: FileText, label: "Forms" },
    { to: "/analyst/maps", icon: Map, label: "Maps" },
    { to: "/analyst/dashboards", icon: BarChart3, label: "Dashboards" },
    { to: "/analyst/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } transition-all duration-300 border-r border-border flex flex-col bg-card`}
      >
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          {sidebarOpen && (
            <h1 className="font-semibold text-lg text-foreground">GIS Analyst</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-border p-4 space-y-2">
          {sidebarOpen && (
            <div className="text-sm">
              <p className="font-medium text-foreground truncate">{user?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size={sidebarOpen ? "default" : "icon"}
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
          </div>
          <SyncStatus />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AnalystLayout;
