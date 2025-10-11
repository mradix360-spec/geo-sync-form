import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Download, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast as sonnerToast } from "sonner";
import html2canvas from "html2canvas";

export function OrganizationSettings() {
  const { user: currentUser } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisations")
        .select("*")
        .eq("id", currentUser?.organisation_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  const { data: invoices } = useQuery({
    queryKey: ["org-invoices", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  const downloadInvoice = async (id: string, num: string) => {
    try {
      const el = document.getElementById(`invoice-${id}`);
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#fff" });
      const link = document.createElement("a");
      link.download = `invoice-${num}.png`;
      link.href = canvas.toDataURL();
      link.click();
      sonnerToast.success("Downloaded");
    } catch {
      sonnerToast.error("Failed");
    }
  };

  useEffect(() => {
    if (organization) {
      setOrganizationName(organization.name);
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("organisations")
        .update({ name: organizationName })
        .eq("id", currentUser?.organisation_id);

      if (error) throw error;

      // Log activity
      await supabase.rpc("log_user_activity", {
        p_user_id: currentUser?.id,
        p_action: "update_organization",
        p_object_type: "organization",
        p_object_id: currentUser?.organisation_id,
        p_details: { name: organizationName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast({ title: "Organization updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyId = () => {
    if (organization?.id) {
      navigator.clipboard.writeText(organization.id);
      setCopied(true);
      toast({ title: "Organization ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Manage your organization name and view organization ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgId">Organization ID</Label>
              <div className="flex gap-2">
                <Input
                  id="orgId"
                  value={organization?.id || ""}
                  disabled
                  className="bg-muted font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyId}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this ID for API integrations and external services
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{organization?.staff_count || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Max Users</p>
                <p className="text-2xl font-bold">{organization?.max_users || 0}</p>
              </div>
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoices?.map((inv: any) => (
            <Card key={inv.id} id={`invoice-${inv.id}`} className="bg-white border-2">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <h4 className="font-bold">INVOICE</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">#{inv.invoice_number}</p>
                  </div>
                  <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'sent' ? 'outline' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                    {inv.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due</p>
                    <p>{new Date(inv.due_date).toLocaleDateString()}</p>
                  </div>
                  {inv.paid_date && (
                    <div>
                      <p className="text-muted-foreground">Paid</p>
                      <p>{new Date(inv.paid_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold">{Number(inv.amount).toLocaleString()} {inv.currency || 'TZS'}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadInvoice(inv.id, inv.invoice_number)}>
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!invoices?.length && <p className="text-center py-4 text-muted-foreground text-sm">No invoices</p>}
        </CardContent>
      </Card>
    </div>
  );
}
