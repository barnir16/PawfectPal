import { Box, Grid, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Add as AddIcon } from "@mui/icons-material";
import { Button } from "../components/common/Button";
import { TaskList } from "../components/tasks/TaskList";

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
  // These would normally come from your API/state
  const stats = {
    totalPets: 3,
    tasksDue: 5,
    upcomingVetVisits: 2,
    monthlySpending: "$120.75",
  };

  const recentTasks = [
    {
      id: 1,
      title: "Morning Walk",
      dueDate: "Today, 8:00 AM",
      pet: "Max",
      completed: false,
    },
    {
      id: 2,
      title: "Vet Appointment",
      dueDate: "Tomorrow, 2:30 PM",
      pet: "Bella",
      completed: false,
    },
    {
      id: 3,
      title: "Buy Food",
      dueDate: "Tomorrow",
      pet: "All",
      completed: true,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Pets" value={stats.totalPets} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Tasks Due" value={stats.tasksDue} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Vet Visits"
            value={stats.upcomingVetVisits}
            description="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Spending"
            value={stats.monthlySpending}
            description="On pet care"
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
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            // Add onClick handler to navigate to new task form
          >
            Add Task
          </Button>
        </Box>
        <TaskList tasks={recentTasks} />
      </Paper>

      {/* Upcoming Events Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Upcoming Events
            </Typography>
            <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
              No upcoming events
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Health Reminders
            </Typography>
            <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
              No health reminders
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
