import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Map, LayoutDashboard, Building2 } from "lucide-react";

export const SystemContentOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['system-content-stats'],
    queryFn: async () => {
      const [formsRes, mapsRes, dashboardsRes, orgsRes] = await Promise.all([
        supabase.from('forms').select('id, organisation_id', { count: 'exact', head: false }),
        supabase.from('maps').select('id, organisation_id', { count: 'exact', head: false }),
        supabase.from('dashboards').select('id, organisation_id', { count: 'exact', head: false }),
        supabase.from('organisations').select('id, name, status', { count: 'exact', head: false })
      ]);

      // Count active organizations
      const activeOrgs = orgsRes.data?.filter(org => org.status === 'active').length || 0;

      // Count content by organization
      const formsByOrg = formsRes.data?.reduce((acc: any, form) => {
        acc[form.organisation_id] = (acc[form.organisation_id] || 0) + 1;
        return acc;
      }, {});

      const mapsByOrg = mapsRes.data?.reduce((acc: any, map) => {
        acc[map.organisation_id] = (acc[map.organisation_id] || 0) + 1;
        return acc;
      }, {});

      const dashboardsByOrg = dashboardsRes.data?.reduce((acc: any, dashboard) => {
        acc[dashboard.organisation_id] = (acc[dashboard.organisation_id] || 0) + 1;
        return acc;
      }, {});

      return {
        totalForms: formsRes.data?.length || 0,
        totalMaps: mapsRes.data?.length || 0,
        totalDashboards: dashboardsRes.data?.length || 0,
        totalOrganizations: orgsRes.data?.length || 0,
        activeOrganizations: activeOrgs,
        formsByOrg,
        mapsByOrg,
        dashboardsByOrg,
      };
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalForms}</div>
            <p className="text-xs text-muted-foreground">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maps</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMaps}</div>
            <p className="text-xs text-muted-foreground">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dashboards</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDashboards}</div>
            <p className="text-xs text-muted-foreground">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrganizations}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalOrganizations} total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
