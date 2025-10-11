import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye, Share2, Users, Globe, Lock } from "lucide-react";

interface ContentItemProps {
  item: any;
  type: 'form' | 'map' | 'dashboard';
  onView: (id: string) => void;
  onShare: (id: string, type: string) => void;
  currentUserId?: string;
}

export function ContentItem({ item, type, onView, onShare, currentUserId }: ContentItemProps) {
  const isOwner = item.created_by === currentUserId;
  const getShareIcon = (shareType?: string) => {
    switch (shareType) {
      case 'public':
        return <Globe className="h-3 w-3" />;
      case 'org':
        return <Users className="h-3 w-3" />;
      case 'private':
        return <Lock className="h-3 w-3" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };

  const getShareLabel = (shareType?: string) => {
    switch (shareType) {
      case 'public':
        return 'Public';
      case 'org':
        return 'Organization';
      case 'private':
        return 'Private';
      default:
        return 'Private';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="font-medium">{item.title}</TableCell>
      <TableCell>
        {item.users?.full_name || item.users?.email || "N/A"}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
          {getShareIcon(item.share_type)}
          {getShareLabel(item.share_type)}
        </Badge>
      </TableCell>
      <TableCell>
        {type === 'form' && (
          <Badge variant={item.is_published ? "default" : "secondary"}>
            {item.is_published ? "Published" : "Draft"}
          </Badge>
        )}
        {type === 'dashboard' && (
          <Badge variant={item.is_public ? "default" : "secondary"}>
            {item.is_public ? "Public" : "Private"}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {new Date(item.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(item.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShare(item.id, type)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
