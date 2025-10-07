import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, Users } from "lucide-react";

export const OrganizationManagement = () => {
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('*, users(count)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Management</CardTitle>
        <CardDescription>Manage all registered organizations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {organizations?.map((org: any) => (
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
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
