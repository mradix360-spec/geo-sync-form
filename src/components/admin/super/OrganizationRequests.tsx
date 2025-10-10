import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";

export const OrganizationRequests = () => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: requests, isLoading } = useQuery({
    queryKey: ['org-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisation_requests')
        .select('*, users!organisation_requests_user_id_fkey(email, full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, orgName }: { requestId: string; orgName: string }) => {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert({ name: orgName, status: 'active', current_users: 1 })
        .select()
        .single();

      if (orgError) throw orgError;

      // Get request
      const { data: request } = await supabase
        .from('organisation_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      // Update user with organization
      const { error: userError } = await supabase
        .from('users')
        .update({ organisation_id: org.id })
        .eq('id', request.user_id);

      if (userError) throw userError;

      // Assign org_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: request.user_id, role: 'org_admin' });

      if (roleError) throw roleError;

      // Update request status
      const { error: updateError } = await supabase
        .from('organisation_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          notes: notes[requestId] || null
        })
        .eq('id', requestId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-organizations'] });
      toast.success('Organization request approved');
    },
    onError: (error) => {
      toast.error('Failed to approve request: ' + error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('organisation_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          notes: notes[requestId] || null
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-requests'] });
      toast.success('Organization request rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject request: ' + error.message);
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Requests</CardTitle>
        <CardDescription>Review and manage organization registration requests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No pending requests</p>
        )}
        {requests?.map((request: any) => (
          <Card key={request.id} className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{request.organisation_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.users?.full_name} ({request.users?.email})
                  </p>
                </div>
                <Badge variant={
                  request.status === 'pending' ? 'outline' :
                  request.status === 'approved' ? 'default' :
                  'destructive'
                }>
                  {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                  {request.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{request.phone_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {request.status === 'pending' && (
                <>
                  <Textarea
                    placeholder="Add notes (optional)"
                    value={notes[request.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [request.id]: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveMutation.mutate({ 
                        requestId: request.id, 
                        orgName: request.organisation_name 
                      })}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </>
              )}

              {request.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Admin Notes</p>
                  <p className="text-sm">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
