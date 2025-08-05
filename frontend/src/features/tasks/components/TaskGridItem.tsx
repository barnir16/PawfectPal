import { Card, CardContent, Typography, Box, Chip, IconButton } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";

interface TaskGridItemProps {
  task: {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    pet: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleComplete: (id: number, completed: boolean) => void;
}

export const TaskGridItem = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskGridItemProps) => {
  const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  } as const;

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        opacity: task.completed ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
      elevation={1}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="div" sx={{ 
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'text.disabled' : 'text.primary',
          }}>
            {task.title}
          </Typography>
          <Chip 
            label={task.priority} 
            size="small" 
            color={priorityColors[task.priority]}
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph sx={{ 
          textDecoration: task.completed ? 'line-through' : 'none',
          mb: 2,
          minHeight: 40,
        }}>
          {task.description}
        </Typography>

        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Pet:
          </Typography>
          <Chip 
            label={task.pet} 
            size="small" 
            variant="outlined"
          />
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Due: {formatDate(task.dueDate)}
        </Typography>
      </CardContent>

      <Box display="flex" justifyContent="space-between" p={1} bgcolor="action.hover">
        <Box>
          <IconButton 
            size="small" 
            color={task.completed ? 'success' : 'default'}
            onClick={() => onToggleComplete(task.id, !task.completed)}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box>
          <IconButton 
            size="small" 
            onClick={() => onEdit(task.id)}
            aria-label="Edit task"
            disabled={task.completed}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default TaskGridItem;
