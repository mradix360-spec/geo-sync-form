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
    <div className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Quick Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:shadow-lg hover:scale-105 transition-all duration-300 group animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.forms}</div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Forms</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:shadow-lg hover:scale-105 transition-all duration-300 group animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.responses}</div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Responses</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:shadow-lg hover:scale-105 transition-all duration-300 group animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <Map className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.maps}</div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">Maps</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 hover:shadow-lg hover:scale-105 transition-all duration-300 group animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.users}</div>
                <div className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">Users</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};
