import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, TrendingUp, FileText, CheckCircle, Plus } from "lucide-react";

export const RevenueManagement = () => {
  const queryClient = useQueryClient();
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "",
    paymentReference: "",
    notes: ""
  });

  const { data: payments } = useQuery({
    queryKey: ['all-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, organisations(name), invoices(invoice_number)')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: invoices } = useQuery({
    queryKey: ['revenue-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, organisations(name)');
      
      if (error) throw error;
      return data;
    }
  });

  const unpaidInvoices = invoices?.filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue');

  const totalRevenue = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
  const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid').length || 0;
  const pendingAmount = invoices?.filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0) || 0;

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const invoice = invoices?.find((inv: any) => inv.id === selectedInvoice);
      if (!invoice) throw new Error('Invoice not found');

      // Insert payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          organisation_id: invoice.organisation_id,
          invoice_id: selectedInvoice,
          amount: parseFloat(paymentData.amount),
          payment_date: paymentData.paymentDate,
          payment_method: paymentData.paymentMethod || null,
          payment_reference: paymentData.paymentReference || null,
          notes: paymentData.notes || null,
          currency: invoice.currency || 'TZS'
        });

      if (paymentError) throw paymentError;

      // Update invoice status to paid
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_date: paymentData.paymentDate 
        })
        .eq('id', selectedInvoice);

      if (invoiceError) throw invoiceError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['all-invoices'] });
      setIsRecordPaymentOpen(false);
      setSelectedInvoice("");
      setPaymentData({
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: "",
        paymentReference: "",
        notes: ""
      });
      toast.success('Payment recorded and invoice marked as paid');
    },
    onError: (error) => {
      toast.error('Failed to record payment: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} TZS</div>
            <p className="text-xs text-muted-foreground">From all payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
            <p className="text-xs text-muted-foreground">Successfully collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAmount.toLocaleString()} TZS</div>
            <p className="text-xs text-muted-foreground">Outstanding invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Payment history from all organizations</CardDescription>
            </div>
            <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>Record a payment received from an organization</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Invoice</Label>
                    <Select value={selectedInvoice} onValueChange={(value) => {
                      setSelectedInvoice(value);
                      const invoice = unpaidInvoices?.find((inv: any) => inv.id === value);
                      if (invoice) {
                        setPaymentData({ ...paymentData, amount: invoice.amount.toString() });
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        {unpaidInvoices?.map((invoice: any) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - {invoice.organisations?.name} - {invoice.amount.toLocaleString()} {invoice.currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Input
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      placeholder="Bank Transfer, M-Pesa, etc."
                    />
                  </div>
                  <div>
                    <Label>Payment Reference</Label>
                    <Input
                      value={paymentData.paymentReference}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                      placeholder="Transaction ID or reference number"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                  <Button 
                    onClick={() => recordPaymentMutation.mutate()}
                    disabled={!selectedInvoice || !paymentData.amount || recordPaymentMutation.isPending}
                    className="w-full"
                  >
                    Record Payment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments?.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{payment.organisations?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.invoices?.invoice_number || 'Direct Payment'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">{payment.amount.toLocaleString()} {payment.currency}</p>
                  {payment.payment_method && (
                    <p className="text-xs text-muted-foreground">{payment.payment_method}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
