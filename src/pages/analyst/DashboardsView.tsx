import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";

const DashboardsView = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboards</h1>
          <p className="text-muted-foreground">Create and manage analytics dashboards</p>
        </div>
        <Button onClick={() => navigate("/dashboard/dashboards/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Dashboard
        </Button>
      </div>

      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
        <p className="text-muted-foreground mb-4">Create your first dashboard to analyze form responses</p>
        <Button onClick={() => navigate("/dashboard/dashboards/new")}>Create Your First Dashboard</Button>
      </div>
    </div>
  );
};

export default DashboardsView;
