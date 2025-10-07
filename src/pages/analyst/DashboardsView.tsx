import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

const DashboardsView = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboards</h1>
          <p className="text-muted-foreground">Create and manage analytics dashboards</p>
        </div>
        <Button onClick={() => navigate("/analyst/dashboards")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Dashboard
        </Button>
      </div>

      <EmptyState
        icon={BarChart3}
        title="No dashboards yet"
        description="Create your first dashboard to analyze form responses"
        actionLabel="Create Your First Dashboard"
        onAction={() => navigate("/analyst/dashboards")}
      />
    </div>
  );
};

export default DashboardsView;
