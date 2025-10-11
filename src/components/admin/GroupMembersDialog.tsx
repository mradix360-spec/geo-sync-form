import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface GroupMember {
  id: string;
  user_id: string;
  users: User;
}

export function GroupMembersDialog({ open, onOpenChange, groupId, groupName }: GroupMembersDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Fetch all users in organization
  const { data: allUsers } = useQuery({
    queryKey: ["org-users", currentUser?.organisation_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("organisation_id", currentUser?.organisation_id)
        .eq("is_active", true)
        .order("email");

      if (error) throw error;
      return data as User[];
    },
    enabled: !!currentUser?.organisation_id && open,
  });

  // Fetch group members
  const { data: groupMembers, isLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_group_members")
        .select(`
          id,
          user_id,
          users (
            id,
            email,
            full_name
          )
        `)
        .eq("group_id", groupId);

      if (error) throw error;
      return data as GroupMember[];
    },
    enabled: open && !!groupId,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("form_group_members")
        .insert({
          group_id: groupId,
          user_id: userId,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast({ title: "Member added successfully" });
      setSelectedUserId("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add member", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("form_group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast({ title: "Member removed successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to remove member", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast({ 
        title: "Error", 
        description: "Please select a user",
        variant: "destructive" 
      });
      return;
    }
    addMemberMutation.mutate(selectedUserId);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    removeMemberMutation.mutate(memberId);
  };

  // Filter out users already in group
  const memberUserIds = groupMembers?.map(m => m.user_id) || [];
  const availableUsers = allUsers?.filter(u => !memberUserIds.includes(u.id)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Group Members</DialogTitle>
          <DialogDescription>
            Add or remove members from {groupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Member Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Add Member</h4>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a user to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      All users are already in this group
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddMember} 
                disabled={addMemberMutation.isPending || !selectedUserId}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Current Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Current Members</h4>
              <Badge variant="secondary">
                {groupMembers?.length || 0} members
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !groupMembers || groupMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members in this group yet</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.users.full_name || "N/A"}
                        </TableCell>
                        <TableCell>{member.users.email}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removeMemberMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
