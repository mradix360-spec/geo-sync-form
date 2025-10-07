import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateMapDialog } from "@/components/maps/CreateMapDialog";
import { MapsList } from "@/components/maps/MapsList";
import { useMaps } from "@/hooks/use-maps";

const MapsView = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { refetch } = useMaps();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maps</h1>
          <p className="text-muted-foreground">View and manage your map configurations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Map
        </Button>
      </div>

      <MapsList />

      <CreateMapDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />
    </div>
  );
};

export default MapsView;
