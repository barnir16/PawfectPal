import { useState } from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  useTheme,
} from "@mui/material";
import {
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";


export interface Task {
  id: number;
  title: string;
  type: string;
  dueDate: string;
  status: "completed" | "upcoming" | "overdue";
}

interface AppointmentsProps {
  tasks: Task[];
  onAddTask?: () => void;
  onTaskAction?: (taskId: number, action: string) => void;
}

export const Appointments = ({
  tasks,
  onAddTask,
  onTaskAction,
}: AppointmentsProps) => {
  const theme = useTheme();
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const getTaskStatus = (dueDate: string, status: string) => {
    const due = new Date(dueDate);

    if (status === "completed") return "completed";
    if (isPast(new Date(due)) && !isToday(due)) return "overdue";
    return "upcoming";
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, yyyy h:mm a");
  };

  const getStatusChip = (dueDate: string, status: string) => {
    const taskStatus = getTaskStatus(dueDate, status);

    switch (taskStatus) {
      case "completed":
        return (
          <Chip
            icon={<CheckCircleIcon fontSize="small" />}
            label="Completed"
            color="success"
            size="small"
            variant="outlined"
          />
        );
      case "overdue":
        return (
          <Chip
            icon={<WarningIcon fontSize="small" />}
            label="Overdue"
            color="error"
            size="small"
            variant="outlined"
          />
        );
      default:
        return (
          <Chip label="Upcoming" color="info" size="small" variant="outlined" />
        );
    }
  };

  const handleTaskClick = (taskId: number) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleTaskAction = (
    e: React.MouseEvent,
    taskId: number,
    action: string
  ) => {
    e.stopPropagation();
    if (onTaskAction) {
      onTaskAction(taskId, action);
    }
  };

  if (tasks.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <EventIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No upcoming appointments
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Schedule appointments and tasks to keep track of your pet's care.
        </Typography>
        {onAddTask && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddTask}
          >
            Schedule Appointment
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        mb: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="h2">
          Upcoming Appointments & Tasks
        </Typography>
        {onAddTask && (
          <Button size="small" startIcon={<AddIcon />} onClick={onAddTask}>
            Add
          </Button>
        )}
      </Box>

      <List disablePadding>
        {tasks.map((task) => (
          <Box key={task.id}>
            <ListItem
              component="button"
              onClick={() => handleTaskClick(task.id)}
              sx={{
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <ListItemIcon>
                <EventIcon
                  color={
                    getTaskStatus(task.dueDate, task.status) === "overdue"
                      ? "error"
                      : "primary"
                  }
                />
              </ListItemIcon>
              <ListItemText
                primary={task.title}
                secondary={formatDueDate(task.dueDate)}
                primaryTypographyProps={{
                  fontWeight: 500,
                }}
              />
              <Box sx={{ mr: 2 }}>
                {getStatusChip(task.dueDate, task.status)}
              </Box>
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="actions"
                  onClick={(e) => handleTaskAction(e, task.id, "more")}
                >
                  <MoreVertIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>

            {expandedTask === task.id && (
              <Box
                sx={{
                  p: 2,
                  pl: 9,
                  bgcolor: "background.default",
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="body2" color="text.secondary" paragraph>
                  Type: {task.type}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => handleTaskAction(e, task.id, "complete")}
                    disabled={task.status === "completed"}
                  >
                    Mark as Complete
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => handleTaskAction(e, task.id, "reschedule")}
                  >
                    Reschedule
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </List>
    </Paper>
  );
};

export default Appointments;
