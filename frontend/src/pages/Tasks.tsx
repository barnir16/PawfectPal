import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import { TaskList } from "../components/tasks/TaskList";

// Mock data - replace with real data from your API
const mockTasks = [
  {
    id: 1,
    title: "Morning Walk",
    description: "Take Max for a 30-minute walk in the park",
    dueDate: "2023-11-15T08:00:00",
    pet: "Max",
    priority: "high",
    completed: false,
  },
  {
    id: 2,
    title: "Vet Appointment",
    description: "Annual checkup for Bella",
    dueDate: "2023-11-16T14:30:00",
    pet: "Bella",
    priority: "high",
    completed: false,
  },
  {
    id: 3,
    title: "Buy Food",
    description: "Get more dog food and treats",
    dueDate: "2023-11-17T18:00:00",
    pet: "All",
    priority: "medium",
    completed: true,
  },
];

const priorityOptions = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const petOptions = [
  { value: "all", label: "All Pets" },
  { value: "Max", label: "Max" },
  { value: "Bella", label: "Bella" },
  { value: "Charlie", label: "Charlie" },
];

export const Tasks = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "grid">("list");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    pet: "all",
  });

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

  // Filter tasks based on selected filters
  const filteredTasks = mockTasks.filter((task) => {
    return (
      (filters.status === "all" ||
        (filters.status === "completed" && task.completed) ||
        (filters.status === "pending" && !task.completed)) &&
      (filters.priority === "all" || task.priority === filters.priority) &&
      (filters.pet === "all" || task.pet === "All" || task.pet === filters.pet)
    );
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTask}
          sx={{ ml: 2 }}
        >
          Add Task
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Filters" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Status"
                name="status"
                select
                value={filters.status}
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Priority"
                name="priority"
                select
                value={filters.priority}
                onChange={handleFilterChange}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Pet"
                name="pet"
                select
                value={filters.pet}
                onChange={handleFilterChange}
              >
                {petOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={handleViewChange}
                aria-label="view mode"
                size="small"
                sx={{ ml: "auto" }}
              >
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {view === "list" ? (
        <TaskList
          tasks={filteredTasks.map((task) => ({
            ...task,
            dueDate: new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))}
          onTaskClick={(taskId) => navigate(`/tasks/${taskId}`)}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <Grid item key={task.id} xs={12} sm={6} md={4} lg={3}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {task.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 2,
                    }}
                  >
                    <Typography variant="caption" color="textSecondary">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {task.pet}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="textSecondary">
                  No tasks found matching your filters
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Tasks;
