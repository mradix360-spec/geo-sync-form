import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const OrgInvoicesView = () => {
  const { user } = useAuth();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['org-invoices', user?.organisation_id],
    enabled: !!user?.organisation_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organisation_id', user?.organisation_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const draftInvoices = invoices?.filter(inv => inv.status === 'draft') || [];
  const sentInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'overdue') || [];
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Invoices</CardTitle>
          <CardDescription>View invoices for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Invoices */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Invoices</h3>
            {sentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invoices</p>
            ) : (
              sentInvoices.map((invoice) => (
                <Card key={invoice.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{invoice.invoice_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          Sent: {invoice.sent_at ? new Date(invoice.sent_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'outline'}>
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
                    {invoice.line_items && Array.isArray(invoice.line_items) && invoice.line_items.length > 0 && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Invoice Breakdown</p>
                        <div className="space-y-2">
                          {(invoice.line_items as any[]).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                              <div>
                                <span className="capitalize font-medium">{item.role?.replace('_', ' ')}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({item.user_count} {item.user_count === 1 ? 'user' : 'users'} × {item.price_per_user?.toLocaleString()} {invoice.currency})
                                </span>
                              </div>
                              <span className="font-semibold">{item.subtotal?.toLocaleString()} {invoice.currency}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t-2 font-bold">
                            <span>Total</span>
                            <span className="text-base">{invoice.amount.toLocaleString()} {invoice.currency}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {invoice.notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <p className="text-muted-foreground">{invoice.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Paid Invoices */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Paid Invoices</h3>
            {paidInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid invoices</p>
            ) : (
              paidInvoices.map((invoice) => (
                <Card key={invoice.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{invoice.invoice_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          Paid: {invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="default">{invoice.status}</Badge>
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
                    {invoice.line_items && Array.isArray(invoice.line_items) && invoice.line_items.length > 0 && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Invoice Breakdown</p>
                        <div className="space-y-2">
                          {(invoice.line_items as any[]).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                              <div>
                                <span className="capitalize font-medium">{item.role?.replace('_', ' ')}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({item.user_count} {item.user_count === 1 ? 'user' : 'users'} × {item.price_per_user?.toLocaleString()} {invoice.currency})
                                </span>
                              </div>
                              <span className="font-semibold">{item.subtotal?.toLocaleString()} {invoice.currency}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t-2 font-bold">
                            <span>Total</span>
                            <span className="text-base">{invoice.amount.toLocaleString()} {invoice.currency}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {invoice.notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <p className="text-muted-foreground">{invoice.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Draft Invoices (view only, no actions) */}
          {draftInvoices.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Draft Invoices</h3>
              {draftInvoices.map((invoice) => (
                <Card key={invoice.id} className="border-2 opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{invoice.invoice_number}</h3>
                        <p className="text-sm text-muted-foreground">Being prepared</p>
                      </div>
                      <Badge variant="secondary">{invoice.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
