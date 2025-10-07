import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, Clock, TrendingUp } from "lucide-react";

export const FieldStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    todaySubmissions: 0,
    weekSubmissions: 0,
    assignedForms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      // Call optimized database function for parallel aggregation
      const { data, error } = await supabase
        .rpc('get_user_field_stats', { p_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        setStats({
          totalSubmissions: Number(result.total_submissions) || 0,
          todaySubmissions: Number(result.today_submissions) || 0,
          weekSubmissions: Number(result.week_submissions) || 0,
          assignedForms: Number(result.assigned_forms) || 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Today",
      value: stats.todaySubmissions,
      icon: Clock,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    },
    {
      title: "This Week",
      value: stats.weekSubmissions,
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    },
    {
      title: "Total",
      value: stats.totalSubmissions,
      icon: MapPin,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
    },
    {
      title: "Forms",
      value: stats.assignedForms,
      icon: FileText,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title} 
            className={`group relative overflow-hidden border-0 shadow-[var(--shadow-card)] hover-lift hover:shadow-[var(--shadow-hover)] transition-all duration-300 bg-gradient-to-br ${stat.bgGradient}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">submissions</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
