import { useEffect, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, User, Calendar } from "lucide-react";

interface ActivityFeedWidgetProps {
  config: any;
  onUpdate: (config: any) => void;
}

export const ActivityFeedWidget = ({ config, onUpdate }: ActivityFeedWidgetProps) => {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const { data: logs } = await supabase
      .from("form_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    setActivities(logs || []);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 items-start">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {activity.object_type}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  );
};
