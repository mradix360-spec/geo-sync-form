import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ContentFilters } from "./content/ContentFilters";
import { ContentStats } from "./content/ContentStats";
import { ContentItem } from "./content/ContentItem";
import { SharePermissionDialog } from "../forms/SharePermissionDialog";

interface ContentItem {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
  users?: { email: string; full_name: string | null };
  is_published?: boolean;
  is_public?: boolean;
  share_type?: string;
}

export function ContentManagement() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [shareFilter, setShareFilter] = useState("all");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: string } | null>(null);

  // Fetch forms with shares
  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ["admin-forms-with-shares", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          users(email, full_name),
          shares(access_type)
        `)
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data?.map(form => ({
        ...form,
        share_type: Array.isArray(form.shares) && form.shares.length > 0 
          ? (form.shares[0] as any).access_type 
          : 'private'
      })) || [];
    },
    enabled: !!currentUser?.organisation_id,
  });

  // Fetch maps with shares
  const { data: maps, isLoading: mapsLoading } = useQuery({
    queryKey: ["admin-maps-with-shares", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select(`
          *,
          users(email, full_name),
          shares(access_type)
        `)
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data?.map(map => ({
        ...map,
        share_type: Array.isArray(map.shares) && map.shares.length > 0 
          ? (map.shares[0] as any).access_type 
          : 'private'
      })) || [];
    },
    enabled: !!currentUser?.organisation_id,
  });

  // Fetch dashboards with shares
  const { data: dashboards, isLoading: dashboardsLoading } = useQuery({
    queryKey: ["admin-dashboards-with-shares", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboards")
        .select(`
          *,
          users(email, full_name),
          shares(access_type)
        `)
        .eq("organisation_id", currentUser?.organisation_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data?.map(dashboard => ({
        ...dashboard,
        share_type: Array.isArray(dashboard.shares) && dashboard.shares.length > 0 
          ? (dashboard.shares[0] as any).access_type 
          : 'private'
      })) || [];
    },
    enabled: !!currentUser?.organisation_id,
  });

  // Combine all content
  const allContent = useMemo(() => {
    const items: Array<ContentItem & { type: 'form' | 'map' | 'dashboard' }> = [];
    
    forms?.forEach(form => items.push({ ...form, type: 'form' }));
    maps?.forEach(map => items.push({ ...map, type: 'map' }));
    dashboards?.forEach(dashboard => items.push({ ...dashboard, type: 'dashboard' }));
    
    return items.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [forms, maps, dashboards]);

  // Filter content
  const filteredContent = useMemo(() => {
    return allContent.filter(item => {
      // Search filter
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.users?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      
      // Share filter
      const matchesShare = shareFilter === 'all' || item.share_type === shareFilter;
      
      return matchesSearch && matchesType && matchesShare;
    });
  }, [allContent, searchQuery, typeFilter, shareFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const sharedCount = allContent.filter(item => 
      item.share_type && item.share_type !== 'private'
    ).length;
    
    return {
      formsCount: forms?.length || 0,
      mapsCount: maps?.length || 0,
      dashboardsCount: dashboards?.length || 0,
      sharedCount,
    };
  }, [forms, maps, dashboards, allContent]);

  const handleView = (id: string, type: 'form' | 'map' | 'dashboard') => {
    switch (type) {
      case 'form':
        navigate(`/form-builder/${id}`);
        break;
      case 'map':
        navigate(`/map-builder/${id}`);
        break;
      case 'dashboard':
        navigate(`/dashboard/${id}`);
        break;
    }
  };

  const handleShare = (id: string, type: string) => {
    setSelectedItem({ id, type });
    setShareDialogOpen(true);
  };

  if (formsLoading || mapsLoading || dashboardsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-muted-foreground">
            Comprehensive view of all forms, maps, and dashboards
          </p>
        </div>

        <ContentStats {...stats} />

        <Card>
          <CardHeader>
            <CardTitle>All Content</CardTitle>
            <CardDescription>
              Search, filter, and manage all content in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              shareFilter={shareFilter}
              onShareFilterChange={setShareFilter}
            />

            {filteredContent.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No content found matching your filters</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Sharing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => (
                      <ContentItem
                        key={`${item.type}-${item.id}`}
                        item={item}
                        type={item.type}
                        onView={(id) => handleView(id, item.type)}
                        onShare={handleShare}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedItem && (
        <SharePermissionDialog
          formId={selectedItem.id}
          objectType={selectedItem.type as 'form' | 'map' | 'dashboard'}
          currentShareType="private"
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          onSuccess={() => {
            // Refetch data to update share status
            if (selectedItem.type === 'form') {
              queryClient.invalidateQueries({ queryKey: ["admin-forms-with-shares"] });
            } else if (selectedItem.type === 'map') {
              queryClient.invalidateQueries({ queryKey: ["admin-maps-with-shares"] });
            } else {
              queryClient.invalidateQueries({ queryKey: ["admin-dashboards-with-shares"] });
            }
          }}
        />
      )}
    </>
  );
}
