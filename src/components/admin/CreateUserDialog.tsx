import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/use-role";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("field_staff");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { hasRole } = useRole();
  const isSuperAdmin = hasRole('super_admin');

  const createMutation = useMutation({
    mutationFn: async () => {
      // Prevent org admins from creating super admin users
      if (!isSuperAdmin && role === 'super_admin') {
        throw new Error('Only super admins can create super admin users');
      }

      // Hash password
      const { data: hashedData, error: hashError } = await supabase.rpc(
        "hash_password",
        { plain_password: password }
      );
      if (hashError) throw hashError;

      // Create user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          email,
          full_name: fullName,
          password_hash: hashedData,
          organisation_id: currentUser?.organisation_id,
          is_active: true,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userData.id,
          role: role as any,
        });

      if (roleError) throw roleError;

      // Log activity
      await supabase.rpc("log_user_activity", {
        p_user_id: currentUser?.id,
        p_action: "create_user",
        p_object_type: "user",
        p_object_id: userData.id,
        p_details: { email, full_name: fullName, role },
      });

      return userData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User created successfully" });
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("field_staff");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to your organization without sending an email invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                <SelectItem value="org_admin">Org Admin</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="field_staff">Field Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
