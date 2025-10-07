import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, FileText, Map, BarChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function ContentManagement() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ["admin-forms", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*, users(email, full_name)")
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  const { data: maps, isLoading: mapsLoading } = useQuery({
    queryKey: ["admin-maps", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select("*, users(email, full_name)")
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  const { data: dashboards, isLoading: dashboardsLoading } = useQuery({
    queryKey: ["admin-dashboards", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboards")
        .select("*, users(email, full_name)")
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  if (formsLoading || mapsLoading || dashboardsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Management</CardTitle>
        <CardDescription>
          View and manage all content within your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="forms">
          <TabsList>
            <TabsTrigger value="forms">
              <FileText className="mr-2 h-4 w-4" />
              Forms ({forms?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="maps">
              <Map className="mr-2 h-4 w-4" />
              Maps ({maps?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="dashboards">
              <BarChart className="mr-2 h-4 w-4" />
              Dashboards ({dashboards?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forms">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms?.map((form: any) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.title}</TableCell>
                    <TableCell>
                      {form.users?.full_name || form.users?.email || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.is_published ? "default" : "secondary"}>
                        {form.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(form.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/form-builder/${form.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="maps">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maps?.map((map: any) => (
                  <TableRow key={map.id}>
                    <TableCell className="font-medium">{map.title}</TableCell>
                    <TableCell>
                      {map.users?.full_name || map.users?.email || "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(map.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/map-builder/${map.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="dashboards">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboards?.map((dashboard: any) => (
                  <TableRow key={dashboard.id}>
                    <TableCell className="font-medium">{dashboard.title}</TableCell>
                    <TableCell>
                      {dashboard.users?.full_name || dashboard.users?.email || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={dashboard.is_public ? "default" : "secondary"}>
                        {dashboard.is_public ? "Public" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(dashboard.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
