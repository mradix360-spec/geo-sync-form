import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/hooks/use-role";
import { Navigate } from "react-router-dom";
import { OrganizationRequests } from "@/components/admin/super/OrganizationRequests";
import { OrganizationManagement } from "@/components/admin/super/OrganizationManagement";
import { BillingManagement } from "@/components/admin/super/BillingManagement";
import { RevenueManagement } from "@/components/admin/super/RevenueManagement";
import { AllUsersManagement } from "@/components/admin/super/AllUsersManagement";
import { SystemContentOverview } from "@/components/admin/super/SystemContentOverview";
import { FormsManagement } from "@/components/admin/super/FormsManagement";
import { MapsManagement } from "@/components/admin/super/MapsManagement";
import { DashboardsManagement } from "@/components/admin/super/DashboardsManagement";

export default function SuperAdminDashboard() {
  const { hasRole } = useRole();

  if (!hasRole('super_admin')) {
    return <Navigate to="/analyst" replace />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage organizations, billing, and system users</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="maps">Maps</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemContentOverview />
        </TabsContent>

        <TabsContent value="requests">
          <OrganizationRequests />
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationManagement />
        </TabsContent>

        <TabsContent value="users">
          <AllUsersManagement />
        </TabsContent>

        <TabsContent value="forms">
          <FormsManagement />
        </TabsContent>

        <TabsContent value="maps">
          <MapsManagement />
        </TabsContent>

        <TabsContent value="dashboards">
          <DashboardsManagement />
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-6">
            <BillingManagement />
            <RevenueManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
