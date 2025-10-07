import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  user_id: string;
  action: string;
  object_type: string | null;
  object_id: string | null;
  details: any;
  created_at: string;
  users: {
    email: string;
    full_name: string | null;
  };
}

export function ActivityLog() {
  const { user: currentUser } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["user-activity", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*, users(email, full_name)")
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!currentUser?.organisation_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("create")) return "default";
    if (action.includes("update")) return "secondary";
    if (action.includes("delete")) return "destructive";
    return "outline";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Recent user activities in your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Object Type</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities?.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {activity.users.full_name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.users.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(activity.action)}>
                    {activity.action.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {activity.object_type || "N/A"}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
