import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Assignment as TasksIcon,
  Vaccines as VaccinesIcon,
} from "@mui/icons-material";
import { TaskList } from "../components/TaskList";
import { TasksToolbar } from "../../../features/tasks/components/TasksToolbar";
import { TaskFilters } from "../../../features/tasks/components/TaskFilters";
import { TasksEmptyState } from "../../../features/tasks/components/TasksEmptyState";
import { TaskGridItem } from "../../../features/tasks/components/TaskGridItem";
import {
  completeTask,
  deleteTask,
  downloadTasksAsICal,
  getTasks,
  syncTasksWithGoogleCalendar,
  updateTask,
} from "../../../services/tasks/taskService";
import { getPets } from "../../../services/pets/petService";
import type { VaccineTask } from "../../../services/tasks/vaccineTaskService";
import { VaccineTaskCompletionDialog } from "../../../components/tasks/VaccineTaskCompletionDialog";
import RealVaccineTracker from "../../../components/tasks/RealVaccineTracker";
import type { Task } from "../../../types/tasks/task";
import type { Pet } from "../../../types/pets/pet";
import { useLocalization } from "../../../contexts/LocalizationContext";

type TaskView = "main" | "vaccines" | "custom";

export const Tasks = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [view, setView] = useState<"list" | "grid">("grid");
  const [taskType, setTaskType] = useState<TaskView>("main");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    pet: "all",
    taskType: "all",
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vaccineCompletionDialog, setVaccineCompletionDialog] = useState<{
    open: boolean;
    vaccineTask: VaccineTask | null;
  }>({ open: false, vaccineTask: null });

  const isVaccineTask = (task: Task) => {
    const normalizedDescription = (task.description || "").toLowerCase();
    return normalizedDescription.includes("vaccine") || normalizedDescription.includes("חיסון");
  };

  const priorityOptions = [
    { value: "all", label: t("tasks.allPriorities") },
    { value: "high", label: t("tasks.high") },
    { value: "medium", label: t("tasks.medium") },
    { value: "low", label: t("tasks.low") },
  ];

  const petOptions = [
    { value: "all", label: t("tasks.allPets") },
    ...pets.map((pet) => ({ value: pet.id?.toString() || "", label: pet.name })),
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, petsData] = await Promise.all([getTasks(), getPets()]);
      setTasks(tasksData);
      setPets(petsData);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError(err instanceof Error ? err.message : t("errors.failedToLoadTasks"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: "list" | "grid" | null
  ) => {
    if (newView) {
      setView(newView);
    }
  };

  const handleDeleteTask = async (id: number | string) => {
    try {
      await deleteTask(Number(id));
      await loadData();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(t("errors.failedToDeleteTask"));
    }
  };

  const handleToggleComplete = async (id: number | string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(Number(id));
      } else {
        await updateTask(Number(id), { isCompleted: false });
      }
      await loadData();
    } catch (err) {
      console.error("Error updating task:", err);
      setError(t("errors.failedToUpdateTask"));
    }
  };

  const handleExportTasks = () => {
    try {
      downloadTasksAsICal(
        tasks,
        `pawfectpal-tasks-${new Date().toISOString().split("T")[0]}.ics`
      );
    } catch (err) {
      console.error("Error exporting tasks:", err);
      setError(t("errors.failedToExportTasks"));
    }
  };

  const handleSyncWithGoogleCalendar = async () => {
    try {
      await syncTasksWithGoogleCalendar(tasks);
    } catch (err) {
      console.error("Error syncing with Google Calendar:", err);
      setError(t("errors.failedToSyncCalendar"));
    }
  };

  const handleVaccineComplete = (taskId: number) => {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (!task || !isVaccineTask(task)) {
      return;
    }

    setVaccineCompletionDialog({
      open: true,
      vaccineTask: {
        ...task,
        vaccineName: task.title,
        vaccineType: "vaccination",
        isOverdue: new Date(task.dateTime) < new Date(),
        nextDueDate: task.dateTime,
        veterinarian: "",
        clinic: "",
        vaccineNotes: task.description || "",
      },
    });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    if (filters.pet !== "all") {
      const petId = parseInt(filters.pet, 10);
      if (!task.petIds.includes(petId)) {
        return false;
      }
    }

    if (filters.status !== "all") {
      if (filters.status === "completed" && !task.isCompleted) {
        return false;
      }
      if (filters.status === "pending" && task.isCompleted) {
        return false;
      }
    }

    if (taskType === "custom" && isVaccineTask(task)) {
      return false;
    }

    return true;
  });

  const formattedTasks = filteredTasks.map((task) => ({
    id: task.id || 0,
    title: task.title,
    description: task.description || t("errors.noDescription"),
    dueDate: task.dateTime,
    pet:
      task.petIds.length > 0
        ? pets.find((pet) => pet.id === task.petIds[0])?.name || t("errors.unknownPet")
        : t("errors.allPets"),
    priority: (task.priority === "urgent" ? "high" : task.priority || "medium") as
      | "low"
      | "medium"
      | "high",
    completed: task.isCompleted || false,
    isVaccine: isVaccineTask(task),
    isOverdue: new Date(task.dateTime) < new Date() && !task.isCompleted,
  }));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (taskType === "main") {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {t("tasks.chooseTaskType")}
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 4 }}>
          {t("tasks.chooseTaskTypeDescription")}
        </Typography>

        <Stack
          spacing={3}
          direction={{ xs: "column", sm: "row" }}
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          <Card sx={{ minWidth: 280, cursor: "pointer" }} onClick={() => setTaskType("vaccines")}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <VaccinesIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                {t("tasks.vaccines")}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t("tasks.vaccinesDescription")}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 280, cursor: "pointer" }} onClick={() => setTaskType("custom")}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <TasksIcon sx={{ fontSize: 64, color: "secondary.main", mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                {t("tasks.customTasks")}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t("tasks.customTasksDescription")}
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                  {tasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("tasks.totalTasks")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                  {tasks.filter((task) => isVaccineTask(task)).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("tasks.vaccines")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                  {tasks.filter((task) => !isVaccineTask(task)).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("tasks.customTasks")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (taskType === "vaccines") {
    return (
      <Box>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h5">{t("tasks.vaccines")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("tasks.vaccinesDescription")}
            </Typography>
          </Box>
        </Box>
        <RealVaccineTracker
          onAddVaccine={() => navigate("/tasks/new?type=vaccine")}
          onBack={() => setTaskType("main")}
        />
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" onClick={() => setTaskType("main")} startIcon={<AddIcon />}>
            {t("tasks.backToMain")}
          </Button>
          <Box>
            <Typography variant="h5">{t("tasks.customTasks")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("tasks.customTasksDescription")}
            </Typography>
          </Box>
        </Box>

        <TasksToolbar
          view={view}
          onViewChange={handleViewChange}
          onAddTask={() => navigate("/tasks/new")}
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
            onEdit={(id) => navigate(`/tasks/edit/${id}`)}
            onDelete={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
          />
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {formattedTasks.map((task, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${task.id}-${index}`}>
                <TaskGridItem
                  task={task}
                  onEdit={(id) => navigate(`/tasks/edit/${id}`)}
                  onDelete={handleDeleteTask}
                  onToggleComplete={handleToggleComplete}
                  onVaccineComplete={handleVaccineComplete}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <VaccineTaskCompletionDialog
        open={vaccineCompletionDialog.open}
        onClose={() => setVaccineCompletionDialog({ open: false, vaccineTask: null })}
        vaccineTask={vaccineCompletionDialog.vaccineTask}
        onTaskCompleted={loadData}
      />
    </>
  );
};

export default Tasks;
