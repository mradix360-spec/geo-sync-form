import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Map as MapIcon, BarChart3 } from "lucide-react";
import Dashboard from "@/pages/Dashboard";

const FormsView = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex gap-3 p-4 bg-card rounded-lg border border-border">
        <Button onClick={() => navigate("/form-builder")} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Create Form
        </Button>
        <Button variant="secondary" onClick={() => navigate("/dashboard/maps/new")} size="lg" className="gap-2">
          <MapIcon className="h-5 w-5" />
          Create Map
        </Button>
        <Button variant="secondary" onClick={() => navigate("/dashboard/dashboards/new")} size="lg" className="gap-2">
          <BarChart3 className="h-5 w-5" />
          Create Dashboard
        </Button>
      </div>

      {/* Forms List - reuse existing Dashboard component */}
      <Dashboard />
    </div>
  );
};

export default FormsView;
