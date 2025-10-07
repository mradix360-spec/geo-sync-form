import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Map as MapIcon } from "lucide-react";

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

      <div className="text-center py-12">
        <MapIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No maps yet</h3>
        <p className="text-muted-foreground mb-4">Create your first map to visualize form data</p>
        <Button onClick={() => navigate("/dashboard/maps/new")}>Create Your First Map</Button>
      </div>
    </div>
  );
};

export default MapsView;
