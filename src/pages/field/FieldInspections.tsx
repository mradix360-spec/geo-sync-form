import { useNavigate } from 'react-router-dom';
import { TaskCard } from '@/components/inspection/TaskCard';
import { TaskStatistics } from '@/components/inspection/TaskStatistics';
import { useInspectionTasks } from '@/hooks/use-inspection-tasks';
import { ClipboardList } from 'lucide-react';

const FieldInspections = () => {
  const navigate = useNavigate();
  const { tasks, loading } = useInspectionTasks(true); // filterByAssigned = true

  const handleStartInspection = (taskId: string) => {
    navigate(`/field/inspection/${taskId}`);
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">My Inspections</h2>
            <p className="text-sm text-muted-foreground">Tasks assigned to you</p>
          </div>
        </div>
      </div>

      <TaskStatistics tasks={tasks} />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No inspection tasks assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStartInspection={() => handleStartInspection(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldInspections;
