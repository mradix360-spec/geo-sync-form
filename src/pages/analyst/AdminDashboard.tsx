import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { OrganizationSettings } from "@/components/admin/OrganizationSettings";
import { LandingPageEditor } from "@/components/admin/LandingPageEditor";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { AccessManagement } from "@/components/admin/content/AccessManagement";
import { GroupManagement } from "@/components/admin/GroupManagement";
import { useRole } from "@/hooks/use-role";
import { Navigate } from "react-router-dom";

export default function AdminDashboard() {
  const { isAdmin, hasRole } = useRole();

  if (!isAdmin()) {
    return <Navigate to="/analyst" replace />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your organization and users</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="landing">Landing Page</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="groups">
          <GroupManagement />
        </TabsContent>

        <TabsContent value="access">
          <AccessManagement />
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent value="landing">
          <LandingPageEditor />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
