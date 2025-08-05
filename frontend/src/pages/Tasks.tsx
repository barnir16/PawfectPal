import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid } from "@mui/material";
import { TaskList, type Task } from "../features/tasks/components/TaskList";
import { TasksToolbar } from "../features/tasks/components/TasksToolbar";
import { TaskFilters } from "../features/tasks/components/TaskFilters";
import { TasksEmptyState } from "../features/tasks/components/TasksEmptyState";
import { TaskGridItem } from "../features/tasks/components/TaskGridItem";

// Mock data - replace with real data from your API
const mockTasks = [
  {
    id: 1,
    title: "Morning Walk",
    description: "Take Max for a 30-minute walk in the park",
    dueDate: "2023-11-15T08:00:00",
    pet: "Max",
    priority: "high" as const,
    completed: false,
  },
  {
    id: 2,
    title: "Vet Appointment",
    description: "Annual checkup for Bella",
    dueDate: "2023-11-16T14:30:00",
    pet: "Bella",
    priority: "high" as const,
    completed: false,
  },
  {
    id: 3,
    title: "Buy Food",
    description: "Get more dog food and treats",
    dueDate: "2023-11-17T18:00:00",
    pet: "All",
    priority: "medium" as const,
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

  const handleEditTask = (id: number | string) => {
    navigate(`/tasks/edit/${id}`);
  };

  const handleDeleteTask = (id: number | string) => {
    // In a real app, this would be an API call
    console.log("Delete task", id);
  };

  const handleToggleComplete = (id: number | string, completed: boolean) => {
    // In a real app, this would be an API call
    console.log(`Mark task ${id} as ${completed ? "completed" : "incomplete"}`);
  };

  // Filter tasks based on selected filters
  const filteredTasks = mockTasks.filter((task) => {
    if (filters.status !== "all" && task.completed !== (filters.status === "completed")) {
      return false;
    }
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }
    if (filters.pet !== "all" && task.pet !== filters.pet) {
      return false;
    }
    return true;
  });

  const hasActiveFilters = Object.values(filters).some(f => f !== 'all');
  const showEmptyState = filteredTasks.length === 0;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <TasksToolbar 
        view={view} 
        onViewChange={handleViewChange} 
        onAddTask={handleAddTask}
      >
        <TaskFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          statusOptions={[
            { value: 'all', label: 'All Statuses' },
            { value: 'completed', label: 'Completed' },
            { value: 'pending', label: 'Pending' },
          ]}
          priorityOptions={priorityOptions}
          petOptions={petOptions}
        />
      </TasksToolbar>

      {showEmptyState ? (
        <TasksEmptyState 
          hasFilters={hasActiveFilters}
          onResetFilters={() => setFilters({ status: 'all', priority: 'all', pet: 'all' })}
          onAddTask={handleAddTask}
        />
      ) : view === 'grid' ? (
        <Grid container spacing={3}>
          {filteredTasks.map((task) => (
            <Grid item key={task.id} xs={12} sm={6} md={4}>
              <TaskGridItem
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TaskList 
          tasks={filteredTasks} 
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </Box>
  );
};

export default Tasks;
