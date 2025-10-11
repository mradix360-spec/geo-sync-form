import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";
import { useNavigate } from "react-router-dom";
import { ContentFilters } from "./content/ContentFilters";
import { ContentStats } from "./content/ContentStats";
import { ContentItem } from "./content/ContentItem";
import { SharePermissionDialog } from "../forms/SharePermissionDialog";
import { EmptyState } from "../shared/EmptyState";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentItem {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
  users?: { email: string; full_name: string | null };
  is_published?: boolean;
  is_public?: boolean;
  share_type?: string;
  group_ids?: string[];
}

export function ContentManagement() {
  const { user: currentUser } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [shareFilter, setShareFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: string } | null>(null);

  // Fetch user's groups
  const { data: userGroups = [] } = useQuery({
    queryKey: ["user-groups", currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_group_members')
        .select('group_id, form_groups(id, name)')
        .eq('user_id', currentUser?.id);

      if (error) throw error;
      
      return data?.map(item => ({
        id: (item.form_groups as any)?.id,
        name: (item.form_groups as any)?.name
      })).filter(g => g.id && g.name) || [];
    },
    enabled: !!currentUser?.id,
  });

  // Fetch forms with comprehensive sharing logic
  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ["content-forms", currentUser?.id, currentUser?.organisation_id],
    queryFn: async () => {
      if (!currentUser?.id || !currentUser?.organisation_id) return [];

      // Get user's groups
      const { data: userGroups } = await supabase
        .from('form_group_members')
        .select('group_id')
        .eq('user_id', currentUser.id);

      const groupIds = userGroups?.map(g => g.group_id) || [];

      // Get all forms
      const { data: allForms, error } = await supabase
        .from('forms')
        .select(`
          *,
          users(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all shares
      const { data: shares } = await supabase
        .from('shares')
        .select('*')
        .eq('object_type', 'form');

      // Filter forms based on visibility - only show content from user's organization
      const visibleForms = allForms?.filter(form => {
        // Only show forms from user's organization
        if (form.organisation_id !== currentUser.organisation_id) {
          return false;
        }

        // Admins can see all content in their organization
        if (isAdmin()) {
          return true;
        }
        
        // Check if form has shares
        const formShares = shares?.filter(s => s.object_id === form.id) || [];
        
        // If no shares exist (private), only show to creator
        if (formShares.length === 0) {
          return form.created_by === currentUser.id;
        }
        
        // If shares exist, show to everyone in org
        return true;
      }) || [];

      // Add share_type to each form
      return visibleForms.map(form => {
        const formShares = shares?.filter(s => s.object_id === form.id) || [];
        let share_type = 'private';
        const group_ids = formShares
          .filter(s => s.group_id)
          .map(s => s.group_id)
          .filter(Boolean) as string[];
        
        if (formShares.some(s => s.access_type === 'public')) {
          share_type = 'public';
        } else if (formShares.some(s => s.shared_with_organisation)) {
          share_type = 'organisation';
        } else if (formShares.some(s => s.group_id)) {
          share_type = 'group';
        } else if (formShares.some(s => s.shared_with_user)) {
          share_type = 'user';
        }

        return { ...form, share_type, group_ids };
      });
    },
    enabled: !!currentUser?.id && !!currentUser?.organisation_id,
  });

  // Fetch maps with comprehensive sharing logic
  const { data: maps, isLoading: mapsLoading } = useQuery({
    queryKey: ["content-maps", currentUser?.id, currentUser?.organisation_id],
    queryFn: async () => {
      if (!currentUser?.id || !currentUser?.organisation_id) return [];

      // Get user's groups
      const { data: userGroups } = await supabase
        .from('form_group_members')
        .select('group_id')
        .eq('user_id', currentUser.id);

      const groupIds = userGroups?.map(g => g.group_id) || [];

      // Get all maps
      const { data: allMaps, error } = await supabase
        .from('maps')
        .select(`
          *,
          users(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all shares
      const { data: shares } = await supabase
        .from('shares')
        .select('*')
        .eq('object_type', 'map');

      // Filter maps based on visibility - only show content from user's organization
      const visibleMaps = allMaps?.filter(map => {
        // Only show maps from user's organization
        if (map.organisation_id !== currentUser.organisation_id) {
          return false;
        }

        // Admins can see all content in their organization
        if (isAdmin()) {
          return true;
        }
        
        // Check if map has shares
        const mapShares = shares?.filter(s => s.object_id === map.id) || [];
        
        // If no shares exist (private), only show to creator
        if (mapShares.length === 0) {
          return map.created_by === currentUser.id;
        }
        
        // If shares exist, show to everyone in org
        return true;
      }) || [];

      // Add share_type to each map
      return visibleMaps.map(map => {
        const mapShares = shares?.filter(s => s.object_id === map.id) || [];
        let share_type = 'private';
        const group_ids = mapShares
          .filter(s => s.group_id)
          .map(s => s.group_id)
          .filter(Boolean) as string[];
        
        if (mapShares.some(s => s.access_type === 'public')) {
          share_type = 'public';
        } else if (mapShares.some(s => s.shared_with_organisation)) {
          share_type = 'organisation';
        } else if (mapShares.some(s => s.group_id)) {
          share_type = 'group';
        } else if (mapShares.some(s => s.shared_with_user)) {
          share_type = 'user';
        }

        return { ...map, share_type, group_ids };
      });
    },
    enabled: !!currentUser?.id && !!currentUser?.organisation_id,
  });

  // Fetch dashboards with comprehensive sharing logic
  const { data: dashboards, isLoading: dashboardsLoading } = useQuery({
    queryKey: ["content-dashboards", currentUser?.id, currentUser?.organisation_id],
    queryFn: async () => {
      if (!currentUser?.id || !currentUser?.organisation_id) return [];

      // Get user's groups
      const { data: userGroups } = await supabase
        .from('form_group_members')
        .select('group_id')
        .eq('user_id', currentUser.id);

      const groupIds = userGroups?.map(g => g.group_id) || [];

      // Get all dashboards
      const { data: allDashboards, error } = await supabase
        .from('dashboards')
        .select(`
          *,
          users(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all shares
      const { data: shares } = await supabase
        .from('shares')
        .select('*')
        .eq('object_type', 'dashboard');

      // Filter dashboards based on visibility - only show content from user's organization
      const visibleDashboards = allDashboards?.filter(dashboard => {
        // Only show dashboards from user's organization
        if (dashboard.organisation_id !== currentUser.organisation_id) {
          return false;
        }

        // Admins can see all content in their organization
        if (isAdmin()) {
          return true;
        }
        
        // Check if dashboard is public
        if (dashboard.is_public) {
          return true;
        }
        
        // Check if dashboard has shares
        const dashboardShares = shares?.filter(s => s.object_id === dashboard.id) || [];
        
        // If no shares exist (private), only show to creator
        if (dashboardShares.length === 0) {
          return dashboard.created_by === currentUser.id;
        }
        
        // If shares exist, show to everyone in org
        return true;
      }) || [];

      // Add share_type to each dashboard
      return visibleDashboards.map(dashboard => {
        const dashboardShares = shares?.filter(s => s.object_id === dashboard.id) || [];
        const group_ids = dashboardShares
          .filter(s => s.group_id)
          .map(s => s.group_id)
          .filter(Boolean) as string[];
        
        if (dashboard.is_public) {
          return { ...dashboard, share_type: 'public', group_ids };
        }

        let share_type = 'private';
        
        if (dashboardShares.some(s => s.access_type === 'public')) {
          share_type = 'public';
        } else if (dashboardShares.some(s => s.shared_with_organisation)) {
          share_type = 'organisation';
        } else if (dashboardShares.some(s => s.group_id)) {
          share_type = 'group';
        } else if (dashboardShares.some(s => s.shared_with_user)) {
          share_type = 'user';
        }

        return { ...dashboard, share_type, group_ids };
      });
    },
    enabled: !!currentUser?.id && !!currentUser?.organisation_id,
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
    const userGroupIds = userGroups.map(g => g.id);
    
    return allContent.filter(item => {
      // Search filter
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.users?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      
      // Share filter
      const matchesShare = shareFilter === 'all' || item.share_type === shareFilter;
      
      // Group filter
      let matchesGroup = true;
      if (groupFilter === 'my-groups') {
        // Show only content shared with groups user is a member of
        matchesGroup = item.group_ids?.some((gid: string) => userGroupIds.includes(gid)) || false;
      } else if (groupFilter !== 'all') {
        // Show content shared with specific group
        matchesGroup = item.group_ids?.includes(groupFilter) || false;
      }
      
      return matchesSearch && matchesType && matchesShare && matchesGroup;
    });
  }, [allContent, searchQuery, typeFilter, shareFilter, groupFilter, userGroups]);

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

  // Show empty state if no content exists
  const hasNoContent = allContent.length === 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Content</h2>
            <p className="text-muted-foreground">
              Manage all forms, maps, and dashboards
            </p>
          </div>
          {!hasNoContent && (
            <div className="flex gap-2">
              <Button onClick={() => navigate('/form-builder')}>
                <Plus className="h-4 w-4 mr-2" />
                New Form
              </Button>
              <Button onClick={() => navigate('/map-builder')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Map
              </Button>
              <Button onClick={() => navigate('/dashboard-builder')} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </div>
          )}
        </div>

        {hasNoContent ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Plus}
                title="No content yet"
                description="Start creating forms, maps, and dashboards to manage your organization's data"
              />
              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={() => navigate('/form-builder')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
                <Button onClick={() => navigate('/map-builder')} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Map
                </Button>
                <Button onClick={() => navigate('/dashboard-builder')} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
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
              groupFilter={groupFilter}
              onGroupFilterChange={setGroupFilter}
              groups={userGroups}
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
                        currentUserId={currentUser?.id}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
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
              queryClient.invalidateQueries({ queryKey: ["content-forms"] });
            } else if (selectedItem.type === 'map') {
              queryClient.invalidateQueries({ queryKey: ["content-maps"] });
            } else {
              queryClient.invalidateQueries({ queryKey: ["content-dashboards"] });
            }
          }}
        />
      )}
    </>
  );
}
