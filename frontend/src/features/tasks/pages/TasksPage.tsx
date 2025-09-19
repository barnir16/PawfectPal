import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Grid, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Container,
  Stack
} from "@mui/material";
import { 
  Vaccines as VaccinesIcon, 
  Assignment as TasksIcon,
  Add as AddIcon 
} from "@mui/icons-material";
import { TaskList } from "../components/TaskList";
import { TasksToolbar } from "./../../../features/tasks/components/TasksToolbar";
import { TaskFilters } from "./../../../features/tasks/components/TaskFilters";
import { TasksEmptyState } from "./../../../features/tasks/components/TasksEmptyState";
import { TaskGridItem } from "./../../../features/tasks/components/TaskGridItem";
import { getTasks, deleteTask, completeTask, updateTask, downloadTasksAsICal, syncTasksWithGoogleCalendar } from "../../../services/tasks/taskService";
import { getPets } from "../../../services/pets/petService";
import { type VaccineTask } from "../../../services/tasks/vaccineTaskService";
import { VaccineTaskCompletionDialog } from "../../../components/tasks/VaccineTaskCompletionDialog";
import RealVaccineTracker from "../../../components/tasks/RealVaccineTracker";
import BeautifulTaskManager from "../../../components/tasks/BeautifulTaskManager";
import type { Task } from "../../../types/tasks/task";
import type { Pet } from "../../../types/pets/pet";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { testVaccineGeneration } from "../../../utils/testVaccines";

export const Tasks = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [view, setView] = useState<"list" | "grid">("grid");
  const [taskType, setTaskType] = useState<"main" | "vaccines" | "custom">("main");
  
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    pet: "all",
    taskType: "all", // Add task type filter
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vaccineCompletionDialog, setVaccineCompletionDialog] = useState<{
    open: boolean;
    vaccineTask: VaccineTask | null;
  }>({ open: false, vaccineTask: null });

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
        setError(err instanceof Error ? err.message : t('errors.failedToLoadTasks'));
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

  const handleVaccines = async () => {
    setTaskType("vaccines");
  };


  const handleCustomTasks = () => {
    setTaskType("custom");
  };

  const handleBackToMain = () => {
    setTaskType("main");
  };



  const handleVaccineCompletionClose = () => {
    setVaccineCompletionDialog({ open: false, vaccineTask: null });
  };

  const handleVaccineTaskCompleted = async () => {
    // Refresh tasks after vaccine completion
    try {
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error refreshing tasks after vaccine completion:', error);
    }
  };

  const handleVaccineComplete = (taskId: number) => {
    // Find the task and open the vaccine completion dialog
    const task = tasks.find(t => t.id === taskId);
    if (task && task.description?.includes('חיסון')) {
      // Convert to VaccineTask format
      const vaccineTask: VaccineTask = {
        ...task,
        vaccineName: task.title,
        vaccineType: 'vaccination',
        isOverdue: new Date(task.dateTime) < new Date(),
        nextDueDate: task.dateTime,
        veterinarian: '',
        clinic: '',
        vaccineNotes: task.description || ''
      };
      setVaccineCompletionDialog({ open: true, vaccineTask });
    }
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
      setError(t('errors.failedToDeleteTask'));
    }
  };

  const handleExportTasks = () => {
    try {
      downloadTasksAsICal(tasks, `pawfectpal-tasks-${new Date().toISOString().split('T')[0]}.ics`);
    } catch (err) {
      console.error('Error exporting tasks:', err);
      setError(t('errors.failedToExportTasks'));
    }
  };

  const handleSyncWithGoogleCalendar = async () => {
    try {
      await syncTasksWithGoogleCalendar(tasks);
      // Show success message (could be implemented with a snackbar)
    } catch (err) {
      console.error('Error syncing with Google Calendar:', err);
      setError(t('errors.failedToSyncCalendar'));
    }
  };

  const handleToggleComplete = async (id: number | string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(Number(id));
      } else {
        // Mark task as incomplete
        await updateTask(Number(id), { isCompleted: false });
      }
      // Refresh tasks after update
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(t('errors.failedToUpdateTask'));
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

    // Task type filter (for vaccines view)
    if (taskType === "vaccines" && !task.description?.includes('חיסון')) {
      return false;
    }
    if (taskType === "custom" && task.description?.includes('חיסון')) {
      return false;
    }
    
    return true
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

  // Main task type selection
  if (taskType === "main") {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {t('tasks.chooseTaskType')}
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 4 }}>
          {t('tasks.chooseTaskTypeDescription')}
        </Typography>
        
        <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }} justifyContent="center" sx={{ mb: 4 }}>
          <Card sx={{ minWidth: 280, cursor: 'pointer' }} onClick={handleVaccines}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <VaccinesIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                {t('tasks.vaccines')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('tasks.vaccinesDescription')}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ minWidth: 280, cursor: 'pointer' }} onClick={handleCustomTasks}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <TasksIcon sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                {t('tasks.customTasks')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('tasks.customTasksDescription')}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
        
        {/* Show both vaccines and custom tasks below */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            {t('tasks.vaccines')}
          </Typography>
          <RealVaccineTracker />
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            {t('tasks.customTasks')}
          </Typography>
          <BeautifulTaskManager />
        </Box>
      </Container>
    );
  }

  // Vaccines
  if (taskType === "vaccines") {
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Vaccine Tracking</Typography>
          <Button
            variant="outlined"
            onClick={testVaccineGeneration}
            sx={{ mb: 2 }}
          >
            🧪 Test Vaccine Generation
          </Button>
        </Box>
        <RealVaccineTracker
          onAddVaccine={() => navigate("/tasks/new?type=vaccine")}
          onBack={handleBackToMain}
        />
      </Box>
    );
  }


  // Convert tasks to the format expected by TaskList and TaskGridItem components
  const formattedTasks = filteredTasks.map(task => ({
    id: task.id || 0,
    title: task.title,
    description: task.description || t('errors.noDescription'),
    dueDate: task.dateTime,
    pet: task.petIds.length > 0 
      ? pets.find(p => p.id === task.petIds[0])?.name || t('errors.unknownPet')
      : t('errors.allPets'),
    priority: (task.priority === 'urgent' ? 'high' : task.priority || 'medium') as 'low' | 'medium' | 'high',
    completed: task.isCompleted || false,
    isVaccine: task.description?.includes('חיסון') || false,
    isOverdue: new Date(task.dateTime) < new Date() && !task.isCompleted,
  }));

  return (
    <>
      <Box>
        {(taskType === "custom") && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={handleBackToMain}
              startIcon={<AddIcon />}
            >
              {t('tasks.backToMain')}
            </Button>
            <Typography variant="h6">
              {t('tasks.customTasks')}
            </Typography>
          </Box>
        )}

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
            {formattedTasks.map((task, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${task.id}-${index}`}>
                              <TaskGridItem
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onVaccineComplete={handleVaccineComplete}
              />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Vaccine Completion Dialog */}
      <VaccineTaskCompletionDialog
        open={vaccineCompletionDialog.open}
        onClose={handleVaccineCompletionClose}
        vaccineTask={vaccineCompletionDialog.vaccineTask}
        onTaskCompleted={handleVaccineTaskCompleted}
      />
    </>
  );
};

export default Tasks;
