import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  roles?: string[];
}

interface FormAssignmentDialogProps {
  formId: string;
  formTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentComplete?: () => void;
}

export const FormAssignmentDialog = ({
  formId,
  formTitle,
  open,
  onOpenChange,
  onAssignmentComplete
}: FormAssignmentDialogProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadUsers();
      loadAssignedUsers();
    }
  }, [open, formId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all users in the organization from AuthContext
      if (!user?.organisation_id) return;

      const { data: orgUsers, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('organisation_id', user.organisation_id);

      if (error) throw error;

      // Get roles for users
      const userIds = orgUsers?.map(u => u.id) || [];
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds)
        .eq('role', 'field_staff');

      const fieldStaffIds = new Set(userRoles?.map(r => r.user_id) || []);
      const fieldStaffUsers = orgUsers?.filter(u => fieldStaffIds.has(u.id)) || [];

      setUsers(fieldStaffUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-assigned-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });

      // Get assigned users for this form
      const { data: assignments, error: assignError } = await supabase
        .from('form_assignments')
        .select('user_id')
        .eq('form_id', formId);

      if (!assignError && assignments) {
        const assignedIds = new Set<string>(assignments.map(a => a.user_id));
        setAssignedUsers(assignedIds);
        setSelectedUsers(new Set<string>(assignedIds));
      }
    } catch (error) {
      console.error('Error loading assigned users:', error);
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const userIdsToAssign = Array.from(selectedUsers);

      const response = await supabase.functions.invoke('assign-form', {
        body: {
          formId,
          userIds: userIdsToAssign
        }
      });

      if (response.error) throw response.error;

      toast({
        title: 'Success',
        description: `Form assigned to ${userIdsToAssign.length} user(s)`,
      });

      onAssignmentComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning form:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign form',
        variant: 'destructive'
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Form: {formTitle}</DialogTitle>
          <DialogDescription>
            Select field users to assign this form to. They will be able to view and submit data for this form.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No field users found in your organization
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent"
                >
                  <Checkbox
                    id={user.id}
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={() => handleToggleUser(user.id)}
                  />
                  <label
                    htmlFor={user.id}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <div className="font-medium">{user.full_name || 'No name'}</div>
                    <div className="text-muted-foreground">{user.email}</div>
                    {assignedUsers.has(user.id) && (
                      <div className="text-xs text-primary">Already assigned</div>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assigning || selectedUsers.size === 0}
          >
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign to {selectedUsers.size} user(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
