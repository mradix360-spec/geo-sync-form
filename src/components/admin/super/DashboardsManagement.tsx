import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { format } from "date-fns";

export const DashboardsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboards, isLoading } = useQuery({
    queryKey: ['all-dashboards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboards')
        .select(`
          id,
          title,
          description,
          is_public,
          created_at,
          created_by,
          organisation_id,
          config,
          organisations(name),
          users!dashboards_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredDashboards = dashboards?.filter(dashboard => 
    dashboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dashboard.organisations as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dashboard.users as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Dashboards</CardTitle>
        <CardDescription>Manage dashboards across all organizations</CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by dashboard name, organization, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dashboard Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Widgets</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDashboards?.map((dashboard: any) => (
              <TableRow key={dashboard.id}>
                <TableCell className="font-medium">{dashboard.title}</TableCell>
                <TableCell>{dashboard.organisations?.name || 'N/A'}</TableCell>
                <TableCell>{dashboard.users?.full_name || dashboard.users?.email || 'Unknown'}</TableCell>
                <TableCell>
                  <Badge variant={dashboard.is_public ? 'default' : 'secondary'}>
                    {dashboard.is_public ? 'Public' : 'Private'}
                  </Badge>
                </TableCell>
                <TableCell>{dashboard.config?.widgets?.length || 0}</TableCell>
                <TableCell>{format(new Date(dashboard.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
