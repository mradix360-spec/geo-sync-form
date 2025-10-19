import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InspectionTask } from '@/types/tracking';
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface TaskStatisticsProps {
  tasks: InspectionTask[];
}

export const TaskStatistics = ({ tasks }: TaskStatisticsProps) => {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  }).length;

  const stats = [
    {
      title: 'Total Tasks',
      value: total,
      icon: ClipboardList,
      color: 'text-blue-500',
    },
    {
      title: 'Pending',
      value: pending,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      title: 'Overdue',
      value: overdue,
      icon: AlertCircle,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
