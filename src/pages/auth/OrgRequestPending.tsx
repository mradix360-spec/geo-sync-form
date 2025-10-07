import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const OrgRequestPending = () => {
  const { user, logout } = useAuth();

  const { data: request, isLoading } = useQuery({
    queryKey: ['org-request', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisation_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-warning" />;
      case 'approved':
        return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Organization Request</CardTitle>
          <CardDescription>
            {user?.full_name}, your organization registration is being reviewed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {request && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">Current request status</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Organization Name</p>
                    <p className="font-medium">{request.organisation_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{request.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  {request.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{request.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {request.status === 'pending' && (
                  <p className="text-center">
                    Your request is being reviewed by our administrators. You will be notified once a decision has been made.
                  </p>
                )}
                {request.status === 'approved' && (
                  <p className="text-center text-success">
                    Congratulations! Your organization has been approved. Please log out and log back in to access your organization.
                  </p>
                )}
                {request.status === 'rejected' && (
                  <p className="text-center text-destructive">
                    Unfortunately, your request was not approved. {request.notes || 'Please contact support for more information.'}
                  </p>
                )}
              </div>
            </>
          )}

          <Button onClick={logout} variant="outline" className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgRequestPending;
