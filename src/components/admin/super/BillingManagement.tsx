import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Send, DollarSign } from "lucide-react";
import { useState } from "react";

export const BillingManagement = () => {
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState({
    amount: "",
    dueDate: "",
    notes: ""
  });

  const { data: organizations } = useQuery({
    queryKey: ['billing-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('id, name')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: invoices } = useQuery({
    queryKey: ['all-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, organisations(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: rolePricing } = useQuery({
    queryKey: ['role-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_pricing')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      // Get invoice number
      const { data: invNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number');

      if (numberError) throw numberError;

      const { error } = await supabase
        .from('invoices')
        .insert({
          organisation_id: selectedOrg,
          invoice_number: invNumber,
          amount: parseFloat(invoiceData.amount),
          due_date: invoiceData.dueDate,
          status: 'draft',
          notes: invoiceData.notes,
          line_items: []
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      toast.success('Invoice created');
      setInvoiceData({ amount: "", dueDate: "", notes: "" });
      setSelectedOrg("");
    },
    onError: (error) => {
      toast.error('Failed to create invoice: ' + error.message);
    }
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      toast.success('Invoice sent to organization');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Pricing</CardTitle>
          <CardDescription>Monthly pricing for each user role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {rolePricing?.map((pricing: any) => (
              <Card key={pricing.id}>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold capitalize">{pricing.role.replace('_', ' ')}</h3>
                  <p className="text-2xl font-bold text-primary">
                    {pricing.price_per_month.toLocaleString()} {pricing.currency}
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>Create and send invoices to organizations</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Organization</Label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.map((org: any) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (TZS)</Label>
                  <Input
                    type="number"
                    value={invoiceData.amount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={invoiceData.notes}
                    onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <Button 
                  onClick={() => generateInvoiceMutation.mutate()} 
                  disabled={!selectedOrg || !invoiceData.amount || !invoiceData.dueDate || generateInvoiceMutation.isPending}
                  className="w-full"
                >
                  Generate Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoices?.map((invoice: any) => (
            <Card key={invoice.id} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{invoice.invoice_number}</h3>
                    <p className="text-sm text-muted-foreground">{invoice.organisations?.name}</p>
                  </div>
                  <Badge variant={
                    invoice.status === 'paid' ? 'default' :
                    invoice.status === 'sent' ? 'outline' :
                    invoice.status === 'overdue' ? 'destructive' :
                    'secondary'
                  }>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">{invoice.amount.toLocaleString()} {invoice.currency}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">{new Date(invoice.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {invoice.status === 'draft' && (
                  <Button
                    onClick={() => sendInvoiceMutation.mutate(invoice.id)}
                    size="sm"
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Organization
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
