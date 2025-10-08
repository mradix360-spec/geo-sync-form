import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { format } from "date-fns";

export const FormsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: forms, isLoading } = useQuery({
    queryKey: ['all-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          status,
          is_published,
          created_at,
          created_by,
          organisation_id,
          organisations(name),
          users!forms_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Count responses for each form
      const formsWithCounts = await Promise.all(
        (data || []).map(async (form) => {
          const { count } = await supabase
            .from('form_responses')
            .select('*', { count: 'exact', head: true })
            .eq('form_id', form.id);
          
          return { ...form, response_count: count || 0 };
        })
      );

      return formsWithCounts;
    }
  });

  const filteredForms = forms?.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.organisations as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.users as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Forms</CardTitle>
        <CardDescription>Manage forms across all organizations</CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by form name, organization, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responses</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredForms?.map((form: any) => (
              <TableRow key={form.id}>
                <TableCell className="font-medium">{form.title}</TableCell>
                <TableCell>{form.organisations?.name || 'N/A'}</TableCell>
                <TableCell>{form.users?.full_name || form.users?.email || 'Unknown'}</TableCell>
                <TableCell>
                  <Badge variant={form.is_published ? 'default' : 'secondary'}>
                    {form.is_published ? 'Published' : form.status}
                  </Badge>
                </TableCell>
                <TableCell>{form.response_count}</TableCell>
                <TableCell>{format(new Date(form.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
