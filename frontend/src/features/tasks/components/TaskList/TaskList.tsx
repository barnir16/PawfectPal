import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import { useLocalization } from "../../../../contexts/LocalizationContext";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  Avatar,
  AvatarGroup,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterListOff as ClearIcon,
  Pets as PetsIcon,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────
type Priority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  petIds: string[];
  petNames?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isToday = (d: string | Date) =>
  new Date().toDateString() === new Date(d).toDateString();

const isTomorrow = (d: string | Date) => {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return t.toDateString() === new Date(d).toDateString();
};

const isPast = (d: string | Date) => new Date(d) < new Date();

function formatDueDate(raw: string) {
  const d = new Date(raw);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday(d))     return { label: `Today · ${time}`,     overdue: isPast(d) };
  if (isTomorrow(d))  return { label: `Tomorrow · ${time}`,  overdue: false };
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return { label: `${date} · ${time}`, overdue: isPast(d) };
}

// ─── Priority config ──────────────────────────────────────────────────────────
// Colors are derived from theme tokens — do not hardcode here.
const usePriorityConfig = () => {
  const theme = useTheme();
  return {
    urgent: { label: 'Urgent', color: theme.palette.error.main,    bg: `${theme.palette.error.main}14`,    border: theme.palette.error.main    },
    high:   { label: 'High',   color: theme.palette.warning.main,  bg: `${theme.palette.warning.main}1A`,  border: theme.palette.warning.main  },
    medium: { label: 'Medium', color: theme.palette.secondary.main, bg: `${theme.palette.secondary.main}14`, border: theme.palette.secondary.main },
    low:    { label: 'Low',    color: theme.palette.text.disabled,  bg: 'transparent',                     border: theme.palette.divider        },
  } as Record<Priority, { label: string; color: string; bg: string; border: string }>;
};

const STATUS: Record<TaskStatus, { label: string; icon: React.ReactNode; chipColor: 'default'|'primary'|'success'|'error' }> = {
  pending:     { label: 'Pending',     icon: <WarningIcon />,     chipColor: 'default'  },
  in_progress: { label: 'In Progress', icon: <WarningIcon />,     chipColor: 'primary'  },
  completed:   { label: 'Completed',   icon: <CheckCircleIcon />, chipColor: 'success'  },
  overdue:     { label: 'Overdue',     icon: <ErrorIcon />,       chipColor: 'error'    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const PetAvatars = ({ names }: { names?: string[] }) => {
  if (!names?.length) return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.7rem' } }}>
      {names.map((n) => (
        <Avatar key={n} alt={n} sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          {n[0].toUpperCase()}
        </Avatar>
      ))}
    </AvatarGroup>
  );
};

// ─── Task card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) => {
  const PRIORITY = usePriorityConfig();
  const p = PRIORITY[task.priority] || PRIORITY.low;
  const s = STATUS[task.status]   || STATUS.pending;
  const { label: dateLabel, overdue } = formatDueDate(task.dueDate);
  const isCompleted = task.status === 'completed';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: overdue && !isCompleted ? (theme: any) => `${theme.palette.error.main}40` : 'divider',
        bgcolor: (theme: any) =>
          isCompleted
            ? `${theme.palette.success.main}0A`
            : overdue
            ? `${theme.palette.error.main}0A`
            : theme.palette.background.paper,
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      }}
    >
      {/* Priority left strip */}
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: p.border, opacity: isCompleted ? 0.3 : 1 }} />

      {/* Content */}
      <Box sx={{ flex: 1, px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          {/* Left: status + title */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4, flexWrap: 'wrap' }}>
              <Chip
                icon={s.icon}
                label={s.label}
                size="small"
                color={s.chipColor}
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: 14 } }}
              />
              <Chip
                label={p.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  bgcolor: p.bg,
                  color: p.color,
                  border: `1px solid ${p.border}`,
                  fontWeight: 600,
                }}
              />
              {task.category && (
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                  {task.category}
                </Typography>
              )}
            </Box>

            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                textDecoration: isCompleted ? 'line-through' : 'none',
                opacity: isCompleted ? 0.55 : 1,
                lineHeight: 1.3,
              }}
            >
              {task.title}
            </Typography>

            {task.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: 0.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 420,
                }}
              >
                {task.description}
              </Typography>
            )}
          </Box>

          {/* Right: actions */}
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Edit">
              <IconButton size="small" color="primary" component={Link} to={`/tasks/${task.id}/edit`}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => onDelete(task.id)}
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Footer row: date + pets */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon sx={{ fontSize: 13, color: overdue && !isCompleted ? 'error.main' : 'text.disabled' }} />
            <Typography
              variant="caption"
              sx={{ color: overdue && !isCompleted ? 'error.main' : 'text.secondary', fontWeight: overdue && !isCompleted ? 600 : 400 }}
            >
              {dateLabel}
            </Typography>
          </Box>
          {task.petNames && task.petNames.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PetsIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <PetAvatars names={task.petNames} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const TaskList = ({ tasks: propTasks, onDelete }: { tasks: Task[]; onDelete: (id: number) => void }) => {
  const { t } = useLocalization();
  const [tasks, setTasks] = useState<Task[]>(propTasks);
  const [filtered, setFiltered] = useState<Task[]>(propTasks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { setTasks(propTasks); setFiltered(propTasks); }, [propTasks]);

  const categories = Array.from(new Set(tasks.map((t) => t.category || 'Uncategorized')));

  useEffect(() => {
    let r = [...tasks];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.petNames?.some((n) => n.toLowerCase().includes(q)) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    if (statusFilter   !== 'all') r = r.filter((t) => t.status   === statusFilter);
    if (priorityFilter !== 'all') r = r.filter((t) => t.priority === priorityFilter);
    if (categoryFilter !== 'all') r = r.filter((t) => (t.category || 'Uncategorized') === categoryFilter);

    // Sort: overdue first, then by due date ascending, completed last
    r.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      if (a.status === 'overdue'   && b.status !== 'overdue')   return -1;
      if (b.status === 'overdue'   && a.status !== 'overdue')   return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    setFiltered(r);
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter]);

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); };
  const hasFilters = search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all';

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this task?')) onDelete(Number(id));
  };

  return (
    <Box>
      {/* Filter bar */}
      <Card sx={{ mb: 2.5, border: '1px solid rgba(244,162,97,0.15)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr 1fr 1fr 1fr auto' },
            alignItems: 'center',
          }}>
            <TextField
              size="small"
              placeholder={t('tasks.searchTasksPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)}>
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <Tooltip title="Clear filters">
              <span>
                <IconButton size="small" onClick={clearFilters} disabled={!hasFilters}
                  sx={{ color: hasFilters ? 'primary.main' : 'text.disabled' }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Header + add button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
          {hasFilters && ' (filtered)'}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          component={Link}
          to="/tasks/new"
          sx={{ fontWeight: 700, px: 2.5 }}
        >
          Add Task
        </Button>
      </Box>

      {/* Task cards */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
          <PetsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography variant="body2">No tasks found</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={handleDelete} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export { PriorityChip, StatusChip, DateCell, PetAvatars };
export default TaskList;
