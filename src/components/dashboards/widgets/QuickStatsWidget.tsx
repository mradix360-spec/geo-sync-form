import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Map, Users, Activity } from "lucide-react";

interface QuickStatsWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const QuickStatsWidget = ({ config, onUpdate }: QuickStatsWidgetProps) => {
  const [stats, setStats] = useState({
    forms: 0,
    responses: 0,
    maps: 0,
    users: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [formsData, responsesData, mapsData, usersData] = await Promise.all([
      supabase.from("forms").select("id", { count: "exact", head: true }),
      supabase.from("form_responses").select("id", { count: "exact", head: true }),
      supabase.from("maps").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      forms: formsData.count || 0,
      responses: responsesData.count || 0,
      maps: mapsData.count || 0,
      users: usersData.count || 0,
    });
  };

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.forms}</div>
                <div className="text-xs text-muted-foreground">Forms</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded">
                <Activity className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.responses}</div>
                <div className="text-xs text-muted-foreground">Responses</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded">
                <Map className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.maps}</div>
                <div className="text-xs text-muted-foreground">Maps</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/10 rounded">
                <Users className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.users}</div>
                <div className="text-xs text-muted-foreground">Users</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};
