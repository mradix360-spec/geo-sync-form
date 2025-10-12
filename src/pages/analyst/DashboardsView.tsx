import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DashboardsList } from "@/components/dashboards/DashboardsList";
import { NaturalLanguageDashboard } from "@/components/ai/NaturalLanguageDashboard";
import { CustomWidgetsList } from "@/components/dashboards/CustomWidgetsList";

const DashboardsView = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboards</h1>
          <p className="text-muted-foreground">Create and manage analytics dashboards</p>
        </div>
        <Button onClick={() => navigate("/dashboard-builder")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Dashboard
        </Button>
      </div>

      <NaturalLanguageDashboard />

      <CustomWidgetsList />

      <DashboardsList />
    </div>
  );
};

export default DashboardsView;
