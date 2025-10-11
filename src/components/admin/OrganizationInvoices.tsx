import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useRef } from "react";

export const OrganizationInvoices = () => {
  const { user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['organization-invoices', user?.organisation_id],
    enabled: !!user?.organisation_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, organisations(name)')
        .eq('organisation_id', user?.organisation_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: organization } = useQuery({
    queryKey: ['organization', user?.organisation_id],
    enabled: !!user?.organisation_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', user?.organisation_id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const downloadInvoiceAsPDF = async (invoice: any) => {
    try {
      const element = document.getElementById(`invoice-${invoice.id}`);
      if (!element) {
        toast.error("Invoice element not found");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `invoice-${invoice.invoice_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to download invoice");
      console.error(error);
    }
  };

  const totalBilled = invoices?.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalPaid = invoices?.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;
  const totalPending = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0) || 0;

  if (isLoading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBilled.toLocaleString()} TZS</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} TZS</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalPending.toLocaleString()} TZS</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and download your organization's invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoices?.map((invoice: any) => (
            <div key={invoice.id}>
              <Card id={`invoice-${invoice.id}`} className="border-2 bg-white">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">INVOICE</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Invoice #: {invoice.invoice_number}</p>
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

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Bill To:</h4>
                      <p className="text-sm">{organization?.name}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Invoice Date</p>
                        <p className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                      </div>
                      {invoice.paid_date && (
                        <div>
                          <p className="text-muted-foreground">Paid Date</p>
                          <p className="font-medium">{new Date(invoice.paid_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {invoice.line_items && invoice.line_items.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left py-2">Description</th>
                              <th className="text-center py-2">Quantity</th>
                              <th className="text-right py-2">Unit Price</th>
                              <th className="text-right py-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.line_items.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b">
                                <td className="py-2 capitalize">{item.role?.replace('_', ' ')}</td>
                                <td className="text-center py-2">{item.user_count}</td>
                                <td className="text-right py-2">{item.price_per_user?.toLocaleString()} {invoice.currency}</td>
                                <td className="text-right py-2">{item.subtotal?.toLocaleString()} {invoice.currency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">{invoice.amount.toLocaleString()} {invoice.currency}</p>
                      </div>
                      <Button onClick={() => downloadInvoiceAsPDF(invoice)} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                    </div>

                    {invoice.notes && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <p className="font-medium">Notes:</p>
                        <p>{invoice.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
          {(!invoices || invoices.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No invoices found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
