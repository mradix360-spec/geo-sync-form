import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InspectionPriority, InspectionStatus } from '@/types/tracking';
import { Filter } from 'lucide-react';

interface InspectionFiltersProps {
  statusFilter: InspectionStatus | 'all';
  priorityFilter: InspectionPriority | 'all';
  onStatusChange: (status: InspectionStatus | 'all') => void;
  onPriorityChange: (priority: InspectionPriority | 'all') => void;
}

const statusOptions: { value: InspectionStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-accent text-accent-foreground' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
];

const priorityOptions: { value: InspectionPriority | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-accent text-accent-foreground' },
  { value: 'low', label: 'Low', color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
];

export const InspectionFilters = ({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
}: InspectionFiltersProps) => {
  return (
    <div className="space-y-3">
      {/* Status Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Status</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(option.value)}
              className={`h-8 rounded-full transition-all ${
                statusFilter === option.value
                  ? 'shadow-md'
                  : 'hover:scale-105'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Priority</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((option) => (
            <Button
              key={option.value}
              variant={priorityFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPriorityChange(option.value)}
              className={`h-8 rounded-full transition-all ${
                priorityFilter === option.value
                  ? 'shadow-md'
                  : 'hover:scale-105'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
