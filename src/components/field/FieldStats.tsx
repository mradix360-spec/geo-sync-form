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
      // Get total submissions
      const { count: totalCount } = await supabase
        .from("form_responses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get today's submissions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("form_responses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      // Get this week's submissions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      const { count: weekCount } = await supabase
        .from("form_responses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      // Get assigned forms count
      const { count: formsCount } = await supabase
        .from("forms")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      setStats({
        totalSubmissions: totalCount || 0,
        todaySubmissions: todayCount || 0,
        weekSubmissions: weekCount || 0,
        assignedForms: formsCount || 0,
      });
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
      color: "text-blue-600",
    },
    {
      title: "This Week",
      value: stats.weekSubmissions,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Total",
      value: stats.totalSubmissions,
      icon: MapPin,
      color: "text-purple-600",
    },
    {
      title: "Forms",
      value: stats.assignedForms,
      icon: FileText,
      color: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
