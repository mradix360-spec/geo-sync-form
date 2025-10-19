import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InspectionTask } from '@/types/tracking';
import { Loader2, Users, User } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface TaskAssignmentDialogProps {
  task: InspectionTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TaskAssignmentDialog = ({ task, open, onOpenChange, onSuccess }: TaskAssignmentDialogProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, task.id]);

  const loadData = async () => {
    if (!user?.organisation_id) return;
    
    setLoading(true);
    try {
      // Load users who can perform inspections (field staff, analysts, admins)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, user_roles(role)')
        .eq('organisation_id', user.organisation_id)
        .eq('is_active', true);

      if (usersError) throw usersError;

      // Filter users with appropriate roles
      const eligibleUsers = (usersData || []).filter((u: any) => 
        u.user_roles?.some((r: any) => 
          ['field_staff', 'analyst', 'org_admin', 'super_admin'].includes(r.role)
        )
      );

      setUsers(eligibleUsers);

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('form_groups')
        .select('id, name')
        .eq('organisation_id', user.organisation_id);

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Load current assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('user_id, group_id')
        .eq('task_id', task.id);

      if (assignmentsError) throw assignmentsError;

      const assignedUserIds = new Set(
        assignmentsData?.filter(a => a.user_id).map(a => a.user_id!) || []
      );
      const assignedGroupIds = new Set(
        assignmentsData?.filter(a => a.group_id).map(a => a.group_id!) || []
      );

      setSelectedUsers(assignedUserIds);
      setSelectedGroups(assignedGroupIds);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading data',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleAssign = async () => {
    if (!user) return;

    setAssigning(true);
    try {
      // Delete existing assignments
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', task.id);

      // Insert new user assignments
      const userAssignments = Array.from(selectedUsers).map(userId => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: user.id,
      }));

      // Insert new group assignments
      const groupAssignments = Array.from(selectedGroups).map(groupId => ({
        task_id: task.id,
        group_id: groupId,
        assigned_by: user.id,
      }));

      const allAssignments = [...userAssignments, ...groupAssignments];

      if (allAssignments.length > 0) {
        const { error } = await supabase
          .from('task_assignments')
          .insert(allAssignments);

        if (error) throw error;
      }

      toast({
        title: 'Task assigned',
        description: `Task assigned to ${selectedUsers.size} user(s) and ${selectedGroups.size} group(s).`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast({
        variant: 'destructive',
        title: 'Error assigning task',
        description: error.message,
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Task: {task.title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="gap-2">
                <User className="h-4 w-4" />
                Users ({selectedUsers.size})
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Users className="h-4 w-4" />
                Groups ({selectedGroups.size})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No eligible users found.
                </p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`user-${u.id}`}
                        checked={selectedUsers.has(u.id)}
                        onCheckedChange={() => handleToggleUser(u.id)}
                      />
                      <Label
                        htmlFor={`user-${u.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{u.full_name || 'Unnamed User'}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              {groups.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No groups found.
                </p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`group-${g.id}`}
                        checked={selectedGroups.has(g.id)}
                        onCheckedChange={() => handleToggleGroup(g.id)}
                      />
                      <Label
                        htmlFor={`group-${g.id}`}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {g.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || assigning || (selectedUsers.size === 0 && selectedGroups.size === 0)}
          >
            {assigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
