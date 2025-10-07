import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Organisation {
  id: string;
  name: string;
  subscription_tier: string;
  staff_count: number;
  max_users: number;
}

const SettingsView = () => {
  const { user } = useAuth();
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganisation = async () => {
      if (!user?.organisation_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', user.organisation_id)
          .single();

        if (error) throw error;
        setOrganisation(data);
      } catch (error) {
        console.error('Error fetching organisation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganisation();
  }, [user?.organisation_id]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={user?.full_name || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <Input value={user?.roles.join(', ') || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisation Information</CardTitle>
          <CardDescription>Your organisation details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <>
              <div className="space-y-2">
                <Label>Organisation Name</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Label>Staff Count</Label>
                <Skeleton className="h-10 w-full" />
              </div>
            </>
          ) : organisation ? (
            <>
              <div className="space-y-2">
                <Label>Organisation Name</Label>
                <Input value={organisation.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Input value={organisation.subscription_tier.toUpperCase()} disabled />
              </div>
              <div className="space-y-2">
                <Label>Staff Count</Label>
                <Input value={`${organisation.staff_count} / ${organisation.max_users}`} disabled />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No organisation information available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsView;
