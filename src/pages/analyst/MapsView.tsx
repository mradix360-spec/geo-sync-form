import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Map as MapIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

const MapsView = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maps</h1>
          <p className="text-muted-foreground">View and manage your map configurations</p>
        </div>
        <Button onClick={() => navigate("/dashboard/maps/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Map
        </Button>
      </div>

      <EmptyState
        icon={MapIcon}
        title="No maps yet"
        description="Create your first map to visualize form data"
        actionLabel="Create Your First Map"
        onAction={() => navigate("/dashboard/maps/new")}
      />
    </div>
  );
};

export default MapsView;
