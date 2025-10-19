import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTaskDialog } from '@/components/inspection/CreateTaskDialog';
import { TaskStatistics } from '@/components/inspection/TaskStatistics';
import { TaskCard } from '@/components/inspection/TaskCard';
import { useInspectionTasks } from '@/hooks/use-inspection-tasks';

const InspectionView = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { tasks, loading, refetch } = useInspectionTasks();

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
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />
    </div>
  );
};

export default InspectionView;
