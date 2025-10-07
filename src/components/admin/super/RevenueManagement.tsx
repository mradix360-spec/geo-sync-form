import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, FileText, CheckCircle } from "lucide-react";

export const RevenueManagement = () => {
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
        .select('amount, status');
      
      if (error) throw error;
      return data;
    }
  });

  const totalRevenue = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;
  const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid').length || 0;
  const pendingAmount = invoices?.filter((inv: any) => inv.status === 'sent')
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0) || 0;

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
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Payment history from all organizations</CardDescription>
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
