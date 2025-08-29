import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, CircularProgress, Alert } from "@mui/material";
import TaskList from "../components/TaskList";
import { TasksToolbar } from "./../../../features/tasks/components/TasksToolbar";
import { TaskFilters } from "./../../../features/tasks/components/TaskFilters";
import { TasksEmptyState } from "./../../../features/tasks/components/TasksEmptyState";
import { TaskGridItem } from "./../../../features/tasks/components/TaskGridItem";
import { getTasks, deleteTask, completeTask, downloadTasksAsICal, syncTasksWithGoogleCalendar } from "../../../services/tasks/taskService";
import { getPets } from "../../../services/pets/petService";
import type { Task } from "../../../types/tasks/task";
import type { Pet } from "../../../types/pets/pet";
import { useLocalization } from "../../../contexts/LocalizationContext";

export const Tasks = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [view, setView] = useState<"list" | "grid">("grid");
  
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    pet: "all",
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create priority options using t() function
  const priorityOptions = [
    { value: "all", label: t('tasks.allPriorities') },
    { value: "high", label: t('tasks.high') },
    { value: "medium", label: t('tasks.medium') },
    { value: "low", label: t('tasks.low') },
  ];

  // Create pet options from real pets
  const petOptions = [
    { value: "all", label: t('tasks.allPets') },
    ...pets.map(pet => ({ value: pet.id?.toString() || '', label: pet.name }))
  ];

  // Load tasks and pets
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [tasksData, petsData] = await Promise.all([
          getTasks(),
          getPets()
        ]);
        
        setTasks(tasksData);
        setPets(petsData);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: "list" | "grid" | null
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleAddTask = () => {
    navigate("/tasks/new");
  };

  const handleEditTask = (id: number | string) => {
    navigate(`/tasks/edit/${id}`);
  };

  const handleDeleteTask = async (id: number | string) => {
    try {
      await deleteTask(Number(id));
      // Refresh tasks after deletion
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  const handleExportTasks = () => {
    try {
      downloadTasksAsICal(tasks, `pawfectpal-tasks-${new Date().toISOString().split('T')[0]}.ics`);
    } catch (err) {
      console.error('Error exporting tasks:', err);
      alert('Failed to export tasks');
    }
  };

  const handleSyncWithGoogleCalendar = async () => {
    try {
      await syncTasksWithGoogleCalendar(tasks);
      alert('Tasks synced with Google Calendar successfully!');
    } catch (err) {
      console.error('Error syncing with Google Calendar:', err);
      alert('Failed to sync with Google Calendar. Check console for details.');
    }
  };

  const handleToggleComplete = async (id: number | string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(Number(id));
      } else {
        // For uncompleting, we need to update the task status
        // This would require an updateTask call with status: 'pending'
        console.log(`Mark task ${id} as incomplete`);
      }
      // Refresh tasks after update
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter((task) => {
    // Priority filter
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }
    
    // Pet filter
    if (filters.pet !== "all") {
      const petId = parseInt(filters.pet);
      if (!task.petIds.includes(petId)) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status !== "all") {
      if (filters.status === "completed" && !task.isCompleted) {
        return false;
      }
      if (filters.status === "pending" && task.isCompleted) {
        return false;
      }
    }
    
    return true;
  });

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Convert tasks to the format expected by TaskList and TaskGridItem components
  const formattedTasks = filteredTasks.map(task => ({
    id: task.id || 0,
    title: task.title,
    description: task.description || "No description",
    dueDate: task.dateTime,
    pet: task.petIds.length > 0 
      ? pets.find(p => p.id === task.petIds[0])?.name || "Unknown Pet"
      : "All Pets",
    priority: (task.priority === 'urgent' ? 'high' : task.priority || 'medium') as 'low' | 'medium' | 'high',
    completed: task.isCompleted || false,
  }));

  return (
    <Box>
      <TasksToolbar
        view={view}
        onViewChange={handleViewChange}
        onAddTask={handleAddTask}
        onExportTasks={handleExportTasks}
        onSyncWithGoogleCalendar={handleSyncWithGoogleCalendar}
      />

      <TaskFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        priorityOptions={priorityOptions}
        petOptions={petOptions}
      />

      {formattedTasks.length === 0 ? (
        <TasksEmptyState hasFilters={false} />
      ) : view === "list" ? (
        <TaskList
          tasks={formattedTasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {formattedTasks.map((task) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={task.id}>
              <TaskGridItem
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Tasks;
