import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskCard } from '@/components/inspection/TaskCard';
import { TaskStatistics } from '@/components/inspection/TaskStatistics';
import { TaskCardSkeleton } from '@/components/inspection/TaskCardSkeleton';
import { InspectionFilters } from '@/components/inspection/InspectionFilters';
import { useInspectionTasks } from '@/hooks/use-inspection-tasks';
import { InspectionPriority, InspectionStatus } from '@/types/tracking';
import { ClipboardList, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

const FieldInspections = () => {
  const navigate = useNavigate();
  const { tasks, loading } = useInspectionTasks(true);
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<InspectionPriority | 'all'>('all');

  const handleStartInspection = (taskId: string) => {
    navigate(`/field/inspection/${taskId}`);
  };

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = statusFilter === 'all' || task.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [tasks, statusFilter, priorityFilter]);

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25 animate-scale-in">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              My Inspections
              {tasks.length > 0 && (
                <span className="text-sm font-normal px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {filteredTasks.length} of {tasks.length}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">Tasks assigned to you</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {!loading && tasks.length > 0 && (
        <TaskStatistics tasks={tasks} />
      )}

      {/* Filters */}
      {!loading && tasks.length > 0 && (
        <Card className="p-4 bg-card/50 backdrop-blur-sm">
          <InspectionFilters
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
          />
        </Card>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/50" />
            </div>
          </div>
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No Inspections Yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            You don't have any inspection tasks assigned yet. Check back later or contact your supervisor.
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Sparkles className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No Matching Tasks</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            No tasks match your current filters. Try adjusting the filters above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 pb-6">
          {filteredTasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TaskCard
                task={task}
                onStartInspection={() => handleStartInspection(task.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldInspections;
