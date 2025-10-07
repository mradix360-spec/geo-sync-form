import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX } from "lucide-react";

interface UserStatsWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const UserStatsWidget = ({ config, onUpdate }: UserStatsWidgetProps) => {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: users } = await supabase.from("users").select("is_active");
    
    const total = users?.length || 0;
    const active = users?.filter(u => u.is_active).length || 0;
    const inactive = total - active;

    setStats({ total, active, inactive });
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">User Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Users className="h-6 w-6 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <UserCheck className="h-6 w-6 mx-auto text-green-500 mb-1" />
            <div className="text-2xl font-bold">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <UserX className="h-6 w-6 mx-auto text-red-500 mb-1" />
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <div className="text-xs text-muted-foreground">Inactive</div>
          </div>
        </div>
      </CardContent>
    </>
  );
};
