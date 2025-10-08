import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { format } from "date-fns";

export const MapsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: maps, isLoading } = useQuery({
    queryKey: ['all-maps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maps')
        .select(`
          id,
          title,
          description,
          created_at,
          created_by,
          organisation_id,
          config,
          organisations(name),
          users!maps_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredMaps = maps?.filter(map => 
    map.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (map.organisations as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (map.users as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Maps</CardTitle>
        <CardDescription>Manage maps across all organizations</CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by map name, organization, or creator..."
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
              <TableHead>Map Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Layers</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaps?.map((map: any) => (
              <TableRow key={map.id}>
                <TableCell className="font-medium">{map.title}</TableCell>
                <TableCell>{map.organisations?.name || 'N/A'}</TableCell>
                <TableCell>{map.users?.full_name || map.users?.email || 'Unknown'}</TableCell>
                <TableCell>{map.config?.layers?.length || 0}</TableCell>
                <TableCell>{format(new Date(map.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
