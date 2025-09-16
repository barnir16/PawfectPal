import { Card, CardContent, Typography, Box, Chip, IconButton, Button, useTheme } from "@mui/material";
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
  const theme = useTheme();
  
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: theme.palette.error.main, bgColor: theme.palette.error.light, label: t('tasks.urgent') || 'Urgent' };
      case 'high':
        return { color: theme.palette.error.main, bgColor: theme.palette.error.light, label: t('tasks.high') || 'High' };
      case 'medium':
        return { color: theme.palette.warning.main, bgColor: theme.palette.warning.light, label: t('tasks.medium') || 'Medium' };
      case 'low':
        return { color: theme.palette.info.main, bgColor: theme.palette.info.light, label: t('tasks.low') || 'Low' };
      default:
        return { color: theme.palette.grey[500], bgColor: theme.palette.grey[100], label: priority };
    }
  };

  const getStatusInfo = (completed: boolean) => {
    if (completed) {
      return { color: theme.palette.success.main, bgColor: theme.palette.success.light, label: t('tasks.completed') || 'Completed' };
    }
    return { color: theme.palette.warning.main, bgColor: theme.palette.warning.light, label: t('tasks.pending') || 'Pending' };
  };

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

  const priorityInfo = getPriorityInfo(task.priority);
  const statusInfo = getStatusInfo(task.completed);

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: `2px solid ${statusInfo.color}`,
        borderRadius: 2,
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
      elevation={1}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="div" sx={{ 
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'text.disabled' : 'text.primary',
            fontWeight: 'bold'
          }}>
            {task.title}
          </Typography>
          <Chip 
            label={priorityInfo.label} 
            size="small" 
            sx={{ 
              bgcolor: priorityInfo.bgColor,
              color: priorityInfo.color,
              fontWeight: 'bold',
              border: `1px solid ${priorityInfo.color}`
            }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph sx={{ 
          textDecoration: task.completed ? 'line-through' : 'none',
          mb: 2,
          minHeight: 40,
        }}>
          {task.description}
        </Typography>

        <Box display="flex" alignItems="center" mb={2} gap={1}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            {t('tasks.assignedTo') || 'Assigned to'}:
          </Typography>
          <Chip 
            label={task.pet} 
            size="small" 
            variant="outlined"
            sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.main }}
          />
          {task.isVaccine && (
            <Chip 
              icon={<VaccinesIcon fontSize="small" />}
              label={t('tasks.vaccination') || 'Vaccination'}
              size="small" 
              sx={{ 
                bgcolor: theme.palette.secondary.light, 
                color: theme.palette.secondary.main,
                border: `1px solid ${theme.palette.secondary.main}`
              }}
            />
          )}
          {task.isOverdue && (
            <Chip 
              label={t('tasks.overdue') || 'Overdue'}
              size="small" 
              sx={{ 
                bgcolor: theme.palette.error.light,
                color: theme.palette.error.main,
                border: `1px solid ${theme.palette.error.main}`
              }}
            />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          {t('tasks.dueDate') || 'Due Date'}: {formatDate(task.dueDate)}
        </Typography>
      </CardContent>

      <Box display="flex" justifyContent="space-between" p={2} bgcolor="grey.50" sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box display="flex" gap={1}>
          <IconButton 
            size="small" 
            color={task.completed ? 'success' : 'default'}
            onClick={() => onToggleComplete(task.id, !task.completed)}
            aria-label={task.completed ? t('tasks.markIncomplete') || 'Mark Incomplete' : t('tasks.markComplete') || 'Mark Complete'}
            sx={{ 
              bgcolor: task.completed ? theme.palette.success.light : theme.palette.grey[100],
              color: task.completed ? theme.palette.success.main : theme.palette.grey[600]
            }}
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
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {t('vaccines.completeVaccine') || 'Complete Vaccine'}
            </Button>
          )}
        </Box>
        <Box display="flex" gap={1}>
          <IconButton 
            size="small" 
            onClick={() => onEdit(task.id)}
            aria-label={t('tasks.edit') || 'Edit task'}
            disabled={task.completed}
            sx={{ 
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.main, color: 'white' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => onDelete(task.id)}
            aria-label={t('tasks.delete') || 'Delete task'}
            sx={{ 
              bgcolor: theme.palette.error.light,
              color: theme.palette.error.main,
              '&:hover': { bgcolor: theme.palette.error.main, color: 'white' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default TaskGridItem;
