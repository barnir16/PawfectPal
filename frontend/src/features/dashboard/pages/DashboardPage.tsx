import { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Add as AddIcon } from "@mui/icons-material";
import { Button } from "./../../../components/ui/Button";
import TaskList from "./../../../features/tasks/components/TaskList";
import type { Task as TaskListTask } from "./../../../features/tasks/components/TaskList";
import { getPets } from "../../../services/pets/petService";
import { getTasks } from "../../../services/tasks/taskService";
import { getOverdueVaccinationsForAllPets } from "../../../services/vaccines/vaccineService";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  height: "100%",
}));

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

const StatCard = ({ title, value, description }: StatCardProps) => (
  <Item elevation={2}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div" sx={{ fontWeight: "bold", mb: 1 }}>
      {value}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    )}
  </Item>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPets: 0,
    tasksDue: 0,
    upcomingVetVisits: 0,
    overdueVaccinations: 0,
  });
  const [recentTasks, setRecentTasks] = useState<TaskListTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch pets, tasks, and vaccination data
        const [petsData, tasksData] = await Promise.all([
          getPets(),
          getTasks()
        ]);
        
        // Get vaccination data for all pets
        let overdueVaccinations: any[] = [];
        
        if (petsData.length > 0) {
          try {
            const overdueData = await getOverdueVaccinationsForAllPets(); // Get overdue vaccinations for all pets
            overdueVaccinations = overdueData;
          } catch (error) {
            console.warn('Could not fetch vaccination data:', error);
            // Continue without vaccination data
          }
        }

        // Calculate stats
        const totalPets = petsData.length;
        const tasksDue = tasksData.filter(task => !task.isCompleted && new Date(task.dateTime) <= new Date()).length;
        const upcomingVetVisits = tasksData.filter(task => 
          !task.isCompleted && 
          task.title.toLowerCase().includes('vet') && 
          new Date(task.dateTime) > new Date()
        ).length;
        const overdueVaccinationsCount = overdueVaccinations.length;

        setStats({
          totalPets,
          tasksDue,
          upcomingVetVisits,
          overdueVaccinations: overdueVaccinationsCount,
        });

        // Get recent tasks (last 5 incomplete tasks) and convert to TaskList format
        const recentIncompleteTasks = tasksData
          .filter(task => !task.isCompleted)
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
          .slice(0, 5)
          .map(task => ({
            id: task.id || 0,
            title: task.title,
            description: task.description,
            dueDate: task.dateTime,
            pet: petsData.find(p => p.id === task.petIds[0])?.name || 'Unknown',
            priority: task.priority || 'medium',
            completed: task.isCompleted || false
          } as TaskListTask));

        setRecentTasks(recentIncompleteTasks);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Pets" value={stats.totalPets} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Tasks Due" value={stats.tasksDue} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Upcoming Vet Visits"
            value={stats.upcomingVetVisits}
            description="This month"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Overdue Vaccinations"
            value={stats.overdueVaccinations}
            description="Need attention"
          />
        </Grid>
      </Grid>

      {/* Recent Tasks */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" component="h2">
            Recent Tasks
          </Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />}>
            Add Task
          </Button>
        </Box>
        
        {recentTasks.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 3 }}>
            No pending tasks. Great job keeping up with your pet care!
          </Typography>
        ) : (
          <TaskList
            tasks={recentTasks}
            onEdit={(id) => {
              // TODO: Add logic for editing a task
              console.log("Edit task with ID:", id);
            }}
            onDelete={(id) => {
              // TODO: Add logic for deleting a task
              console.log("Delete task with ID:", id);
            }}
            onToggleComplete={(id, completed) => {
              // TODO: Add logic for toggling task completion
              console.log("Toggle task with ID:", id, "to completed:", completed);
            }}
          />
        )}
      </Paper>

      {/* Upcoming Events Section */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Upcoming Events
            </Typography>
            {stats.upcomingVetVisits > 0 ? (
              <Typography color="primary">
                {stats.upcomingVetVisits} vet appointment(s) scheduled
              </Typography>
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                No upcoming events
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Health Reminders
            </Typography>
            {stats.overdueVaccinations > 0 ? (
              <Typography color="error">
                {stats.overdueVaccinations} vaccination(s) overdue
              </Typography>
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                All vaccinations up to date
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
