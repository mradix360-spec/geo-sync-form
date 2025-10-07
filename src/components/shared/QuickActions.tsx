import { Button } from "@/components/ui/button";
import { Plus, Map as MapIcon, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 p-4 bg-card rounded-lg border border-border shadow-sm">
      <Button onClick={() => navigate("/form-builder")} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Create Form
      </Button>
      <Button 
        variant="secondary" 
        onClick={() => navigate("/analyst/maps")} 
        size="lg" 
        className="gap-2"
      >
        <MapIcon className="h-5 w-5" />
        View Maps
      </Button>
      <Button 
        variant="secondary" 
        onClick={() => navigate("/analyst/dashboards")} 
        size="lg" 
        className="gap-2"
      >
        <BarChart3 className="h-5 w-5" />
        View Dashboards
      </Button>
    </div>
  );
};
