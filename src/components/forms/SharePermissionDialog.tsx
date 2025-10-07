import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, Users, Building2, Globe, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SharePermissionDialogProps {
  formId: string;
  objectType?: 'form' | 'map';
  currentShareType?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const SharePermissionDialog = ({
  formId,
  objectType = 'form',
  currentShareType = 'private',
  open,
  onOpenChange,
  onSuccess,
}: SharePermissionDialogProps) => {
  const [shareType, setShareType] = useState(currentShareType);
  const [loading, setLoading] = useState(false);

  const shareOptions = [
    {
      value: 'private',
      label: 'Private',
      description: 'Only you can access this form',
      icon: Lock,
    },
    {
      value: 'organisation',
      label: 'Organisation',
      description: 'All members of your organisation can access',
      icon: Building2,
    },
    {
      value: 'group',
      label: 'Group',
      description: 'Share with specific groups',
      icon: UserPlus,
    },
    {
      value: 'other_organisation',
      label: 'Other Organisations',
      description: 'Share with other organisations',
      icon: Users,
    },
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone with the link can access',
      icon: Globe,
    },
  ];

  const handleSave = async () => {
    try {
      setLoading(true);

      // Get current user's organisation
      const { data: userData } = await supabase
        .from('users')
        .select('organisation_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userData?.organisation_id) {
        throw new Error('User organisation not found');
      }

      // Check if share exists
      const { data: existingShare } = await supabase
        .from('shares')
        .select('id')
        .eq('object_id', formId)
        .maybeSingle();

      if (existingShare) {
        // Update existing share
        const { error } = await supabase
          .from('shares')
          .update({
            access_type: shareType,
            organisation_id: userData.organisation_id,
          })
          .eq('id', existingShare.id);

        if (error) throw error;
      } else {
        // Create new share
        const { error } = await supabase
          .from('shares')
          .insert({
            object_id: formId,
            object_type: objectType,
            access_type: shareType,
            organisation_id: userData.organisation_id,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `${objectType === 'form' ? 'Form' : 'Map'} sharing settings updated`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating share settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update sharing settings',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share {objectType === 'form' ? 'Form' : 'Map'}</DialogTitle>
          <DialogDescription>
            Control who can access this {objectType}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={shareType} onValueChange={setShareType} className="space-y-3">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.value}
                className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => setShareType(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex-1">
                  <Label
                    htmlFor={option.value}
                    className="flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
