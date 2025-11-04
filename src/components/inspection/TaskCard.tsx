import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InspectionTask } from '@/types/tracking';
import { Calendar, MapPin, CheckCircle2, Play, UserPlus, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useAssets } from '@/hooks/use-assets';
import { useMemo } from 'react';

interface TaskCardProps {
  task: InspectionTask;
  onViewDetails?: () => void;
  onStartInspection?: () => void;
  onAssign?: (task: InspectionTask) => void;
  showActions?: boolean;
}

const priorityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const statusColors = {
  pending: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export const TaskCard = ({ task, onViewDetails, onStartInspection, onAssign, showActions = true }: TaskCardProps) => {
  const { assets } = useAssets();
  
  const taskAssets = useMemo(() => {
    if (!task.asset_group_ids || task.asset_group_ids.length === 0) return [];
    return assets.filter(asset => task.asset_group_ids?.includes(asset.id));
  }, [task.asset_group_ids, assets]);

  const hasMultipleAssets = taskAssets.length > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <div className="flex gap-2">
            <Badge className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            <Badge className={statusColors[task.status]}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          {task.asset && !hasMultipleAssets && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{task.asset.name}</span>
            </div>
          )}

          {hasMultipleAssets && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{taskAssets.length} assets assigned</span>
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
            </div>
          )}

          {task.completed_at && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Completed: {format(new Date(task.completed_at), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            {onAssign && (
              <Button variant="outline" size="sm" onClick={() => onAssign(task)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Assign
              </Button>
            )}
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                View Details
              </Button>
            )}
            {onStartInspection && task.status === 'pending' && (
              <Button size="sm" onClick={onStartInspection} className="gap-2">
                <Play className="w-4 h-4" />
                Start
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
