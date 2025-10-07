import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Lock, Users, Building2, Globe, UserPlus, Copy, Check, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SharePermissionDialogProps {
  formId: string;
  objectType?: 'form' | 'map' | 'dashboard';
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
  const { user } = useAuth();
  const [shareType, setShareType] = useState(currentShareType);
  const [loading, setLoading] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    if (open && shareType === 'public') {
      loadShareToken();
    }
  }, [open, shareType, formId]);

  const loadShareToken = async () => {
    try {
      const { data } = await supabase
        .from('shares')
        .select('token')
        .eq('object_id', formId)
        .eq('object_type', objectType)
        .eq('access_type', 'public')
        .maybeSingle();

      if (data?.token) {
        setShareToken(data.token);
      }
    } catch (error) {
      console.error('Error loading share token:', error);
    }
  };

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

      // Get current user's organisation from AuthContext
      if (!user?.organisation_id) {
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
            organisation_id: user.organisation_id,
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
            organisation_id: user.organisation_id,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `${objectType === 'form' ? 'Form' : 'Map'} sharing settings updated`,
      });

      if (shareType === 'public') {
        await loadShareToken();
      } else {
        setShareToken(null);
      }

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

  const getPublicUrl = () => {
    if (!shareToken) return '';
    return `${window.location.origin}/public/${objectType}/${shareToken}`;
  };

  const getEmbedCode = () => {
    if (!shareToken) return '';
    const embedUrl = `${window.location.origin}/embed/${objectType}/${shareToken}`;
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border:0;" allowfullscreen></iframe>`;
  };

  const copyToClipboard = async (text: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
      toast({
        title: 'Copied!',
        description: `${type === 'link' ? 'Link' : 'Embed code'} copied to clipboard`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to copy to clipboard',
      });
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

        {shareType === 'public' && shareToken && (
          <>
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Public Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={getPublicUrl()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getPublicUrl(), 'link')}
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Embed Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={getEmbedCode()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
                  >
                    {copiedEmbed ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Copy this code to embed the {objectType} in your website
                </p>
              </div>
            </div>
          </>
        )}

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
