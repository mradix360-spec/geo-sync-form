import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Building2, Phone, Mail, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRole } from "@/hooks/use-role";
import { Navigate } from "react-router-dom";

const OrgRequestPending = () => {
  const { user, logout } = useAuth();
  const { isSuperAdmin } = useRole();

  // Redirect super admins to their dashboard
  if (isSuperAdmin()) {
    return <Navigate to="/analyst" replace />;
  }

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
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              {request?.status === 'pending' ? (
                <Clock className="w-12 h-12 text-primary animate-pulse" />
              ) : (
                <Building2 className="w-12 h-12 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {request?.status === 'pending' ? 'Application Under Review' : 'Organization Request'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Thank you for registering, {user?.full_name}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {request?.status === 'pending' && (
            <Alert className="border-primary/20 bg-primary/5">
              <Shield className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base ml-2">
                <strong className="block mb-2">Your application is being reviewed by our team</strong>
                <p className="text-muted-foreground">
                  We're verifying your organization details to ensure platform security. This typically takes 24-48 hours.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {request && (
            <>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-semibold">Application Status</p>
                      <p className="text-sm text-muted-foreground">Current review status</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="p-4 border rounded-lg space-y-3 bg-card">
                  <h3 className="font-semibold text-lg mb-3">Application Details</h3>
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Organization Name</p>
                        <p className="font-medium">{request.organisation_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Number</p>
                        <p className="font-medium">{request.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email Address</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted On</p>
                        <p className="font-medium">{new Date(request.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {request.notes && (
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Admin Notes</p>
                          <p className="font-medium">{request.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                {request.status === 'pending' && (
                  <>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      What Happens Next?
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground ml-6 list-disc">
                      <li>
                        <strong className="text-foreground">Expect a Call:</strong> Our verification team will contact you at <strong>{request.phone_number}</strong> to confirm your organization details
                      </li>
                      <li>
                        <strong className="text-foreground">Verification Process:</strong> We'll verify your organization's legitimacy and discuss your platform needs
                      </li>
                      <li>
                        <strong className="text-foreground">Timeline:</strong> Most applications are processed within 24-48 hours during business days
                      </li>
                      <li>
                        <strong className="text-foreground">Stay Available:</strong> Please keep your phone accessible and check your email regularly
                      </li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3 p-3 bg-background rounded border">
                      <strong className="text-foreground">Need urgent access?</strong> Contact us at <a href="mailto:support@geosync.com" className="text-primary hover:underline">support@geosync.com</a> with your registration details.
                    </p>
                  </>
                )}
                {request.status === 'approved' && (
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                    <p className="text-success font-semibold text-lg">
                      Congratulations! Your organization has been approved
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please log out and log back in to access your organization dashboard
                    </p>
                  </div>
                )}
                {request.status === 'rejected' && (
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-semibold text-lg">
                      Application Not Approved
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {request.notes || 'Please contact our support team for more information about your application.'}
                    </p>
                  </div>
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
