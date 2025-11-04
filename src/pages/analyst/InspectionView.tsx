import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTaskDialog } from '@/components/inspection/CreateTaskDialog';
import { TaskAssignmentDialog } from '@/components/inspection/TaskAssignmentDialog';
import { TaskStatistics } from '@/components/inspection/TaskStatistics';
import { TaskCard } from '@/components/inspection/TaskCard';
import { useInspectionTasks } from '@/hooks/use-inspection-tasks';
import { InspectionTask } from '@/types/tracking';

const InspectionView = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
  const { tasks, loading, refetch } = useInspectionTasks();

  const handleAssign = (task: InspectionTask) => {
    setSelectedTask(task);
    setShowAssignDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inspection Tasks</h1>
          <p className="text-muted-foreground">Create and manage inspection tasks</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      <TaskStatistics tasks={tasks} />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No inspection tasks yet.</p>
          <p className="text-sm mt-2">Create a task to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task}
              onAssign={handleAssign}
            />
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />

      {selectedTask && (
        <TaskAssignmentDialog
          task={selectedTask}
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};

export default InspectionView;
