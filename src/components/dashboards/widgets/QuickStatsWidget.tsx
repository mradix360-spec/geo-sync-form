import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Map, Users, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "./Sparkline";

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
  const [trends, setTrends] = useState({
    forms: 0,
    responses: 0,
    maps: 0,
    users: 0,
  });
  const [sparklines, setSparklines] = useState<{
    responses: number[];
  }>({
    responses: [],
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

    // Calculate trends and sparklines for responses
    const { data: allResponses } = await supabase
      .from("form_responses")
      .select("created_at")
      .order("created_at", { ascending: true });

    if (allResponses) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recent = allResponses.filter(r => new Date(r.created_at) >= thirtyDaysAgo);
      const previous = allResponses.filter(r => 
        new Date(r.created_at) >= sixtyDaysAgo && new Date(r.created_at) < thirtyDaysAgo
      );

      const responseTrend = previous.length > 0 
        ? ((recent.length - previous.length) / previous.length) * 100 
        : 0;

      setTrends(prev => ({ ...prev, responses: responseTrend }));

      // Generate sparkline for last 14 days
      const sparkline: number[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayCount = allResponses.filter(r => {
          const responseDate = new Date(r.created_at);
          return responseDate >= date && responseDate < nextDate;
        }).length;
        
        sparkline.push(dayCount);
      }
      setSparklines({ responses: sparkline });
    }
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
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:shadow-lg hover:scale-105 transition-all duration-300 group animate-fade-in col-span-2" style={{ animationDelay: '50ms' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                    {stats.responses}
                    {trends.responses !== 0 && (
                      <span className={`text-sm font-medium ${
                        trends.responses > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {trends.responses > 0 ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingDown className="h-4 w-4 inline" />}
                        {Math.abs(trends.responses).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Responses</div>
                </div>
              </div>
            </div>
            {sparklines.responses.length > 0 && (
              <div className="h-10 mt-1">
                <Sparkline data={sparklines.responses} color="#22c55e" />
              </div>
            )}
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
