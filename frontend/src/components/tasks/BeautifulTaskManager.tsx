import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Avatar,
  Divider,
  Stack,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Assignment as TaskIcon,
  PriorityHigh as HighPriorityIcon,
  Flag as MediumPriorityIcon,
  Remove as LowPriorityIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  FileDownload as ExportIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { Task as BackendTask } from '../../types/tasks/task';
import { useLocalization } from '../../contexts/LocalizationContext';
import { getPets } from '../../services/pets/petService';
import { getTasks, createTask, updateTask, deleteTask, completeTask, downloadTasksAsICal, syncTasksWithGoogleCalendar } from '../../services/tasks/taskService';

interface Task extends BackendTask {
  // Additional display fields
  petName?: string;
  category?: string;
  reminder?: boolean;
  notes?: string;
}

interface Pet {
  id: number;
  name: string;
  breed?: string;
  age?: number;
}

interface TaskDisplayRecord extends Task {
  petInfo?: Pet;
  daysUntilDue?: number;
  isOverdue?: boolean;
}

const BeautifulTaskManager: React.FC = () => {
  const theme = useTheme();
  const { t } = useLocalization();
  
  // State management
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskDisplayRecord[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as Task['priority'],
    petId: '',
    category: '',
    reminder: true,
    notes: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [petsData, tasksData] = await Promise.all([
        getPets(),
        getTasks()
      ]);
      
      
      setPets(petsData);
      setTasks(tasksData);
      
    } catch (err) {
      console.error('❌ Error loading task data:', err);
      setError(t('tasks.failedToLoadTasks') || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Process and filter tasks
  useEffect(() => {
    const processedTasks = tasks.map((task): TaskDisplayRecord => {
      const backendTask = task as BackendTask;
      const petInfo = pets.find(pet => pet.id === backendTask.petIds?.[0]);
      const dueDate = backendTask.dateTime ? new Date(backendTask.dateTime) : null;
      const today = new Date();
      const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const isOverdue = dueDate ? dueDate < today && backendTask.status !== 'completed' : false;

      return {
        ...backendTask,
        dueDate: backendTask.dateTime,
        petId: backendTask.petIds?.[0],
        petName: petInfo?.name,
        petInfo,
        daysUntilDue,
        isOverdue,
        status: isOverdue ? 'pending' as const : (backendTask.status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'cancelled'
      };
    });

    // Filter by pet
    const filtered = selectedPet === 'all' 
      ? processedTasks 
      : processedTasks.filter(task => task.petId?.toString() === selectedPet);

    setFilteredTasks(filtered);
  }, [tasks, pets, selectedPet]);

  // Get priority info
  const getPriorityInfo = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return { 
          icon: <HighPriorityIcon />, 
          color: theme.palette.error.main, 
          bgColor: theme.palette.error.light,
          label: t('tasks.urgent') || 'Urgent'
        };
      case 'high':
        return { 
          icon: <HighPriorityIcon />, 
          color: theme.palette.warning.main, 
          bgColor: theme.palette.warning.light,
          label: t('tasks.high') || 'High'
        };
      case 'medium':
        return { 
          icon: <MediumPriorityIcon />, 
          color: theme.palette.info.main, 
          bgColor: theme.palette.info.light,
          label: t('tasks.medium') || 'Medium'
        };
      case 'low':
        return { 
          icon: <LowPriorityIcon />, 
          color: theme.palette.success.main, 
          bgColor: theme.palette.success.light,
          label: t('tasks.low') || 'Low'
        };
      default:
        return { 
          icon: <MediumPriorityIcon />, 
          color: theme.palette.grey[500], 
          bgColor: theme.palette.grey[100],
          label: t('tasks.medium') || 'Medium'
        };
    }
  };

  // Get status info
  const getStatusInfo = (status: TaskDisplayRecord['status']) => {
    switch (status) {
      case 'completed':
        return { 
          color: theme.palette.success.main, 
          bgColor: theme.palette.success.light,
          label: t('tasks.completed') || 'Completed'
        };
      case 'overdue':
        return { 
          color: theme.palette.error.main, 
          bgColor: theme.palette.error.light,
          label: t('tasks.overdue') || 'Overdue'
        };
      case 'pending':
        return { 
          color: theme.palette.warning.main, 
          bgColor: theme.palette.warning.light,
          label: t('tasks.pending') || 'Pending'
        };
      default:
        return { 
          color: theme.palette.grey[500], 
          bgColor: theme.palette.grey[100],
          label: t('tasks.pending') || 'Pending'
        };
    }
  };

  // Get task counts
  const getTaskCounts = () => {
    const all = filteredTasks.length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const overdue = filteredTasks.filter(t => t.status === 'overdue').length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    
    return { all, pending, overdue, completed };
  };

  // Get tasks by tab
  const getTasksByTab = () => {
    const counts = getTaskCounts();
    switch (selectedTab) {
      case 0: return filteredTasks; // All
      case 1: return filteredTasks.filter(t => t.status === 'overdue'); // Overdue
      case 2: return filteredTasks.filter(t => t.status === 'pending'); // Pending
      case 3: return filteredTasks.filter(t => t.status === 'completed'); // Completed
      default: return filteredTasks;
    }
  };

  // Handle task actions
  const handleAddTask = async () => {
    try {
      setIsSubmitting(true);
      const taskData = {
        title: formData.title,
        description: formData.description || "",
        dateTime: formData.dueDate || new Date().toISOString(),
        petIds: formData.petId ? [parseInt(formData.petId)] : [],
        priority: formData.priority,
        repeatInterval: undefined,
        repeatUnit: undefined,
        repeatEndDate: undefined,
        attachments: [],
        status: 'pending' as const,
        isCompleted: false,
      };
      await createTask(taskData);
      setSuccessMessage(t('tasks.taskCreated') || 'Task created successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('❌ Error creating task:', err);
      setError(t('tasks.failedToCreateTask') || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async () => {
    if (!selectedTask) return;
    
    try {
      setIsSubmitting(true);
      const taskData = {
        title: formData.title,
        description: formData.description || "",
        dateTime: formData.dueDate || new Date().toISOString(),
        petIds: formData.petId ? [parseInt(formData.petId)] : [],
        priority: formData.priority,
        repeatInterval: undefined,
        repeatUnit: undefined,
        repeatEndDate: undefined,
        attachments: [],
        status: 'pending',
        isCompleted: false,
      };
      await updateTask(selectedTask.id, taskData);
      setSuccessMessage(t('tasks.taskUpdated') || 'Task updated successfully!');
      setIsEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error('❌ Error updating task:', err);
      setError(t('tasks.failedToUpdateTask') || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      setSuccessMessage(t('tasks.taskCompleted') || 'Task completed!');
      loadData();
    } catch (err) {
      console.error('❌ Error completing task:', err);
      setError(t('tasks.failedToCompleteTask') || 'Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm(t('tasks.confirmDelete') || 'Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await deleteTask(taskId);
      setSuccessMessage(t('tasks.taskDeleted') || 'Task deleted!');
      loadData();
    } catch (err) {
      console.error('❌ Error deleting task:', err);
      setError(t('tasks.failedToDeleteTask') || 'Failed to delete task');
    }
  };

  const handleExportTasks = async () => {
    try {
      // Convert our task format to the expected format
      const formattedTasks = tasks.map(task => ({
        ...task,
        dateTime: task.dueDate || new Date().toISOString(),
        petIds: task.petId ? [task.petId] : [],
        isCompleted: task.status === 'completed',
        repeatInterval: null,
        repeatUnit: null,
        repeatEndDate: null,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 1
      }));
      
      downloadTasksAsICal(formattedTasks);
      setSuccessMessage(t('tasks.tasksExported') || 'Tasks exported to calendar!');
    } catch (err) {
      console.error('❌ Error exporting tasks:', err);
      setError(t('tasks.failedToExportTasks') || 'Failed to export tasks');
    }
  };

  const handleSyncWithGoogle = async () => {
    try {
      // Convert our task format to the expected format
      const formattedTasks = tasks.map(task => ({
        ...task,
        dateTime: task.dueDate || new Date().toISOString(),
        petIds: task.petId ? [task.petId] : [],
        isCompleted: task.status === 'completed',
        repeatInterval: null,
        repeatUnit: null,
        repeatEndDate: null,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 1
      }));
      
      await syncTasksWithGoogleCalendar(formattedTasks);
      setSuccessMessage(t('tasks.tasksSynced') || 'Tasks synced with Google Calendar!');
    } catch (err) {
      console.error('❌ Error syncing tasks:', err);
      setError(t('tasks.failedToSyncTasks') || 'Failed to sync tasks');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      petId: '',
      category: '',
      reminder: true,
      notes: ''
    });
    setSelectedTask(null);
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: (task as BackendTask).dateTime || '', // Cast to BackendTask to access dateTime
      priority: task.priority || 'medium',
      petId: (task as BackendTask).petIds?.[0]?.toString() || '', // Cast to BackendTask to access petIds
      category: '', // Backend doesn't have category field yet
      reminder: true,
      notes: '' // Backend doesn't have notes field yet
    });
    setIsEditDialogOpen(true);
  };

  const counts = getTaskCounts();
  const currentTasks = getTasksByTab();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <LinearProgress sx={{ width: '50%' }} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          {t('tasks.loadingTasks') || 'Loading tasks...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: theme.palette.primary.main }}><TaskIcon /></Avatar>}
          title={t('tasks.title') || 'Task Management'}
          subheader={t('tasks.manageYourTasks') || 'Manage your pet care tasks efficiently'}
          action={
            <Stack direction="row" spacing={1}>
              <Tooltip title={t('tasks.exportToICal') || 'Export to Calendar'}>
                <IconButton onClick={handleExportTasks}>
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('tasks.syncWithGoogleCalendar') || 'Sync with Google Calendar'}>
                <IconButton onClick={handleSyncWithGoogle}>
                  <SyncIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('tasks.refresh') || 'Refresh'}>
                <IconButton onClick={loadData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddDialogOpen(true)}
              >
                {t('tasks.addTask') || 'Add Task'}
              </Button>
            </Stack>
          }
        />
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>{t('tasks.filterByPet') || 'Filter by Pet'}</InputLabel>
              <Select
                value={selectedPet}
                label={t('tasks.filterByPet') || 'Filter by Pet'}
                onChange={(e) => setSelectedPet(e.target.value)}
              >
                <MenuItem value="all">{t('tasks.allPets') || 'All Pets'}</MenuItem>
                {pets.map((pet) => (
                  <MenuItem key={pet.id} value={pet.id.toString()}>
                    {pet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: theme.palette.success.main, color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {counts.all}
            </Typography>
            <Typography variant="body2">
              {t('tasks.totalTasks') || 'Total Tasks'}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: theme.palette.error.main, color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {counts.overdue}
            </Typography>
            <Typography variant="body2">
              {t('tasks.overdue') || 'Overdue'}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: theme.palette.warning.main, color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {counts.pending}
            </Typography>
            <Typography variant="body2">
              {t('tasks.pending') || 'Pending'}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: theme.palette.info.main, color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {counts.completed}
            </Typography>
            <Typography variant="body2">
              {t('tasks.completed') || 'Completed'}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            label={
              <Badge badgeContent={counts.all} color="primary">
                {t('tasks.allTasks') || 'All Tasks'}
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={counts.overdue} color="error">
                {t('tasks.overdue') || 'Overdue'}
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={counts.pending} color="warning">
                {t('tasks.pending') || 'Pending'}
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={counts.completed} color="success">
                {t('tasks.completed') || 'Completed'}
              </Badge>
            } 
          />
        </Tabs>

        <CardContent>
          {currentTasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TaskIcon sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {t('tasks.noTasks') || 'No tasks found'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {currentTasks.map((task) => {
                const priorityInfo = getPriorityInfo(task.priority);
                const statusInfo = getStatusInfo(task.status);
                
                return (
                  <Grid key={task.id} size={{ xs: 12 }}>
                    <Card 
                      sx={{ 
                        border: `2px solid ${statusInfo.color}`,
                        borderRadius: 2,
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-2px)',
                          transition: 'all 0.3s ease-in-out'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {task.title}
                            </Typography>
                            {task.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {task.description}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              <Chip 
                                icon={priorityInfo.icon}
                                label={priorityInfo.label}
                                size="small"
                                sx={{ 
                                  bgcolor: priorityInfo.bgColor, 
                                  color: priorityInfo.color,
                                  fontWeight: 'bold'
                                }}
                              />
                              <Chip 
                                label={statusInfo.label}
                                size="small"
                                sx={{ 
                                  bgcolor: statusInfo.bgColor, 
                                  color: statusInfo.color,
                                  fontWeight: 'bold'
                                }}
                              />
                              {task.petInfo && (
                                <Chip 
                                  icon={<PetsIcon />}
                                  label={task.petInfo.name}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                            {task.dueDate && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {t('tasks.dueDate') || 'Due'}: {new Date(task.dueDate).toLocaleDateString()}
                                  {task.daysUntilDue !== null && (
                                    <span style={{ marginLeft: 8 }}>
                                      ({task.daysUntilDue > 0 
                                        ? `${task.daysUntilDue} ${t('tasks.daysLeft') || 'days left'}`
                                        : task.daysUntilDue === 0 
                                        ? t('tasks.dueToday') || 'Due today'
                                        : `${Math.abs(task.daysUntilDue)} ${t('tasks.daysOverdue') || 'days overdue'}`
                                      })
                                    </span>
                                  )}
                                </Typography>
                              </Box>
                            )}
                            {task.notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                {t('tasks.notes') || 'Notes'}: {task.notes}
                              </Typography>
                            )}
                          </Box>
                          <Stack direction="row" spacing={1}>
                            {task.status !== 'completed' && (
                              <Tooltip title={t('tasks.markComplete') || 'Mark Complete'}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCompleteTask(task.id)}
                                  sx={{ color: theme.palette.success.main }}
                                >
                                  <CompleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={t('tasks.edit') || 'Edit'}>
                              <IconButton 
                                size="small" 
                                onClick={() => openEditDialog(task)}
                                sx={{ color: theme.palette.primary.main }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('tasks.delete') || 'Delete'}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteTask(task.id)}
                                sx={{ color: theme.palette.error.main }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('tasks.addTask') || 'Add New Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label={t('tasks.taskTitle') || 'Task Title'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={t('tasks.description') || 'Description'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label={t('tasks.dueDate') || 'Due Date'}
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>{t('tasks.priority') || 'Priority'}</InputLabel>
              <Select
                value={formData.priority}
                label={t('tasks.priority') || 'Priority'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              >
                <MenuItem value="low">{t('tasks.low') || 'Low'}</MenuItem>
                <MenuItem value="medium">{t('tasks.medium') || 'Medium'}</MenuItem>
                <MenuItem value="high">{t('tasks.high') || 'High'}</MenuItem>
                <MenuItem value="urgent">{t('tasks.urgent') || 'Urgent'}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('tasks.assignToPet') || 'Assign to Pet'}</InputLabel>
              <Select
                value={formData.petId}
                label={t('tasks.assignToPet') || 'Assign to Pet'}
                onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
              >
                <MenuItem value="">{t('tasks.noPet') || 'No specific pet'}</MenuItem>
                {pets.map((pet) => (
                  <MenuItem key={pet.id} value={pet.id.toString()}>
                    {pet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('tasks.category') || 'Category'}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('tasks.notes') || 'Notes'}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleAddTask} 
            variant="contained"
            disabled={!formData.title || isSubmitting}
          >
            {isSubmitting ? t('common.saving') || 'Saving...' : t('tasks.addTask') || 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('tasks.editTask') || 'Edit Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label={t('tasks.taskTitle') || 'Task Title'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={t('tasks.description') || 'Description'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label={t('tasks.dueDate') || 'Due Date'}
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>{t('tasks.priority') || 'Priority'}</InputLabel>
              <Select
                value={formData.priority}
                label={t('tasks.priority') || 'Priority'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              >
                <MenuItem value="low">{t('tasks.low') || 'Low'}</MenuItem>
                <MenuItem value="medium">{t('tasks.medium') || 'Medium'}</MenuItem>
                <MenuItem value="high">{t('tasks.high') || 'High'}</MenuItem>
                <MenuItem value="urgent">{t('tasks.urgent') || 'Urgent'}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('tasks.assignToPet') || 'Assign to Pet'}</InputLabel>
              <Select
                value={formData.petId}
                label={t('tasks.assignToPet') || 'Assign to Pet'}
                onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
              >
                <MenuItem value="">{t('tasks.noPet') || 'No specific pet'}</MenuItem>
                {pets.map((pet) => (
                  <MenuItem key={pet.id} value={pet.id.toString()}>
                    {pet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('tasks.category') || 'Category'}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('tasks.notes') || 'Notes'}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            onClick={handleEditTask} 
            variant="contained"
            disabled={!formData.title || isSubmitting}
          >
            {isSubmitting ? t('common.saving') || 'Saving...' : t('tasks.updateTask') || 'Update Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BeautifulTaskManager;
