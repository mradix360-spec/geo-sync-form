import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package } from 'lucide-react';
import { CreateTaskDialog } from '@/components/inspection/CreateTaskDialog';
import { TaskAssignmentDialog } from '@/components/inspection/TaskAssignmentDialog';
import { AssetGroupDialog } from '@/components/inspection/AssetGroupDialog';
import { TaskStatistics } from '@/components/inspection/TaskStatistics';
import { TaskCard } from '@/components/inspection/TaskCard';
import { useInspectionTasks } from '@/hooks/use-inspection-tasks';
import { useAssetGroups } from '@/hooks/use-asset-groups';
import { InspectionTask, AssetGroup } from '@/types/tracking';
import { Card, CardContent } from '@/components/ui/card';

const InspectionView = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AssetGroup | null>(null);
  const { tasks, loading, refetch } = useInspectionTasks();
  const { assetGroups, loading: groupsLoading, deleteAssetGroup, refetch: refetchGroups } = useAssetGroups();

  const handleAssign = (task: InspectionTask) => {
    setSelectedTask(task);
    setShowAssignDialog(true);
  };

  const handleEditGroup = (group: AssetGroup) => {
    setSelectedGroup(group);
    setShowGroupDialog(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this asset group?')) {
      await deleteAssetGroup(groupId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inspection Management</h1>
          <p className="text-muted-foreground">Manage tasks and asset groups</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="groups">Asset Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-end">
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
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => { setSelectedGroup(null); setShowGroupDialog(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Asset Group
            </Button>
          </div>

          {groupsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading asset groups...</div>
          ) : assetGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No asset groups yet.</p>
              <p className="text-sm mt-2">Create a group to organize your assets.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assetGroups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">{group.name}</h3>
                          </div>
                          {group.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {group.asset_ids.length} asset{group.asset_ids.length !== 1 ? 's' : ''}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      <AssetGroupDialog
        open={showGroupDialog}
        onOpenChange={(open) => {
          setShowGroupDialog(open);
          if (!open) setSelectedGroup(null);
        }}
        group={selectedGroup}
        onSuccess={refetchGroups}
      />
    </div>
  );
};

export default InspectionView;
