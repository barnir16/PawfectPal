import { Card, CardContent, Typography, Box, Chip, IconButton, Button } from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon,
  Vaccines as VaccinesIcon 
} from "@mui/icons-material";
import { useLocalization } from "../../../contexts/LocalizationContext";

interface TaskGridItemProps {
  task: {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    pet: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    completed: boolean;
    isVaccine?: boolean;
    isOverdue?: boolean;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleComplete: (id: number, completed: boolean) => void;
  onVaccineComplete?: (id: number) => void;
}

export const TaskGridItem = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  onVaccineComplete,
}: TaskGridItemProps) => {
  const { t } = useLocalization();
  
  const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'info',
    urgent: 'error', // Added urgent color
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
            label={t(`tasks.${task.priority}`)} 
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
            {t('tasks.petLabel')}:
          </Typography>
          <Chip 
            label={task.pet} 
            size="small" 
            variant="outlined"
          />
          {task.isVaccine && (
            <Chip 
              icon={<VaccinesIcon fontSize="small" />}
              label={t('tasks.vaccination')}
              size="small" 
              color="primary"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
          {task.isOverdue && (
            <Chip 
              label={t('tasks.overdue')}
              size="small" 
              color="error"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          {t('tasks.dueLabel')} {formatDate(task.dueDate)}
        </Typography>
      </CardContent>

            <Box display="flex" justifyContent="space-between" p={1} bgcolor="action.hover">
        <Box>
          <IconButton 
            size="small" 
            color={task.completed ? 'success' : 'default'}
            onClick={() => onToggleComplete(task.id, !task.completed)}
            aria-label={task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>
          {task.isVaccine && !task.completed && onVaccineComplete && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<VaccinesIcon />}
              onClick={() => onVaccineComplete(task.id)}
              sx={{ ml: 1, minWidth: 'auto', px: 1 }}
            >
              {t('vaccines.completeVaccine')}
            </Button>
          )}
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
