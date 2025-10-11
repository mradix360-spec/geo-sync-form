import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Globe, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AccessManagement() {
  const { user: currentUser } = useAuth();

  const { data: shares, isLoading } = useQuery({
    queryKey: ["access-management", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select(`
          *,
          form_groups(name),
          organisations!shares_shared_with_organisation_fkey(name)
        `)
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.organisation_id,
  });

  // Get content details for each share
  const { data: enrichedShares, isLoading: contentLoading } = useQuery({
    queryKey: ["enriched-shares", shares],
    queryFn: async () => {
      if (!shares) return [];

      const enriched = await Promise.all(
        shares.map(async (share) => {
          let contentTitle = "Unknown";
          
          try {
            if (share.object_type === 'form') {
              const { data } = await supabase
                .from("forms")
                .select("title")
                .eq("id", share.object_id)
                .single();
              contentTitle = data?.title || "Unknown Form";
            } else if (share.object_type === 'map') {
              const { data } = await supabase
                .from("maps")
                .select("title")
                .eq("id", share.object_id)
                .single();
              contentTitle = data?.title || "Unknown Map";
            } else if (share.object_type === 'dashboard') {
              const { data } = await supabase
                .from("dashboards")
                .select("title")
                .eq("id", share.object_id)
                .single();
              contentTitle = data?.title || "Unknown Dashboard";
            }
          } catch (error) {
            console.error("Error fetching content title:", error);
          }

          return {
            ...share,
            contentTitle,
          };
        })
      );

      return enriched;
    },
    enabled: !!shares && shares.length > 0,
  });

  const getAccessIcon = (accessType: string) => {
    switch (accessType) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'org':
        return <Users className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getAccessDescription = (share: any) => {
    if (share.access_type === 'public') {
      return 'Anyone with the link';
    } else if (share.group_id) {
      return `Group: ${share.form_groups?.name || 'Unknown'}`;
    } else if (share.shared_with_organisation) {
      return `Organization: ${share.organisations?.name || 'Unknown'}`;
    } else if (share.access_type === 'org') {
      return 'All organization members';
    } else {
      return 'Private';
    }
  };

  if (isLoading || contentLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Management</CardTitle>
        <CardDescription>
          View and manage who has access to your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!enrichedShares || enrichedShares.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shared content yet</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Shared With</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedShares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell className="font-medium">
                      {share.contentTitle}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {share.object_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        {getAccessIcon(share.access_type)}
                        {share.access_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getAccessDescription(share)}
                    </TableCell>
                    <TableCell>
                      {new Date(share.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
