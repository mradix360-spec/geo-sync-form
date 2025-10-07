import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/hooks/use-role";
import { Navigate } from "react-router-dom";
import { OrganizationRequests } from "@/components/admin/super/OrganizationRequests";
import { OrganizationManagement } from "@/components/admin/super/OrganizationManagement";
import { BillingManagement } from "@/components/admin/super/BillingManagement";
import { RevenueManagement } from "@/components/admin/super/RevenueManagement";
import { AllUsersManagement } from "@/components/admin/super/AllUsersManagement";

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

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <OrganizationRequests />
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationManagement />
        </TabsContent>

        <TabsContent value="billing">
          <BillingManagement />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueManagement />
        </TabsContent>

        <TabsContent value="users">
          <AllUsersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
