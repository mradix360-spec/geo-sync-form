import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InspectionTask } from '@/types/tracking';
import { Calendar, MapPin, CheckCircle2, Play } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: InspectionTask;
  onViewDetails?: () => void;
  onStartInspection?: () => void;
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

export const TaskCard = ({ task, onViewDetails, onStartInspection, showActions = true }: TaskCardProps) => {
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
          {task.asset && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{task.asset.name}</span>
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
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
                View Details
              </Button>
            )}
            {onStartInspection && task.status === 'pending' && (
              <Button size="sm" onClick={onStartInspection} className="flex-1 gap-2">
                <Play className="w-4 h-4" />
                Start Inspection
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
