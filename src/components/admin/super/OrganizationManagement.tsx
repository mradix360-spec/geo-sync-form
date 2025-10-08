import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Users, FileText, Map, LayoutDashboard, Search } from "lucide-react";

export const OrganizationManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMaxUsers, setEditingMaxUsers] = useState<{[key: string]: number}>({});

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get content stats for each organization
      const orgsWithStats = await Promise.all(
        (data || []).map(async (org) => {
          const [usersRes, formsRes, mapsRes, dashboardsRes, responsesRes] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('organisation_id', org.id).eq('is_active', true),
            supabase.from('forms').select('id', { count: 'exact', head: true }).eq('organisation_id', org.id),
            supabase.from('maps').select('id', { count: 'exact', head: true }).eq('organisation_id', org.id),
            supabase.from('dashboards').select('id', { count: 'exact', head: true }).eq('organisation_id', org.id),
            supabase.from('form_responses').select('id', { count: 'exact', head: true }).in('form_id', 
              (await supabase.from('forms').select('id').eq('organisation_id', org.id)).data?.map(f => f.id) || []
            )
          ]);

          return {
            ...org,
            current_users: usersRes.count || 0,
            forms_count: formsRes.count || 0,
            maps_count: mapsRes.count || 0,
            dashboards_count: dashboardsRes.count || 0,
            responses_count: responsesRes.count || 0
          };
        })
      );

      return orgsWithStats;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ orgId, newStatus }: { orgId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('organisations')
        .update({ status: newStatus })
        .eq('id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-organizations'] });
      toast.success('Organization status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  const updateMaxUsersMutation = useMutation({
    mutationFn: async ({ orgId, maxUsers }: { orgId: string; maxUsers: number }) => {
      const { error } = await supabase
        .from('organisations')
        .update({ max_users: maxUsers })
        .eq('id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-organizations'] });
      setEditingMaxUsers({});
      toast.success('Max users limit updated');
    },
    onError: (error) => {
      toast.error('Failed to update limit: ' + error.message);
    }
  });

  const filteredOrganizations = organizations?.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Management</CardTitle>
        <CardDescription>Manage all registered organizations</CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredOrganizations?.map((org: any) => (
          <Card key={org.id} className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {org.current_users || 0} users
                    </p>
                  </div>
                </div>
                <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                  {org.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Active Status</span>
                  <Switch
                    checked={org.status === 'active'}
                    onCheckedChange={(checked) => {
                      toggleStatusMutation.mutate({
                        orgId: org.id,
                        newStatus: checked ? 'active' : 'inactive'
                      });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Max Users</span>
                    <p className="text-xs text-muted-foreground">
                      Current: {org.current_users} / {org.max_users}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      className="w-20"
                      value={editingMaxUsers[org.id] ?? org.max_users}
                      onChange={(e) => setEditingMaxUsers({ ...editingMaxUsers, [org.id]: parseInt(e.target.value) })}
                    />
                    <Button
                      size="sm"
                      onClick={() => updateMaxUsersMutation.mutate({ 
                        orgId: org.id, 
                        maxUsers: editingMaxUsers[org.id] ?? org.max_users 
                      })}
                      disabled={!editingMaxUsers[org.id] || editingMaxUsers[org.id] === org.max_users}
                    >
                      Update
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Forms</p>
                      <p className="text-sm font-semibold">{org.forms_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Map className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Maps</p>
                      <p className="text-sm font-semibold">{org.maps_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dashboards</p>
                      <p className="text-sm font-semibold">{org.dashboards_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Responses</p>
                      <p className="text-sm font-semibold">{org.responses_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
