import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isBefore, isToday, isTomorrow } from "date-fns";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  Avatar,
  AvatarGroup,
  Badge,
  Checkbox,
  FormControlLabel,
  Switch,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Pets as PetIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  GridSortModel,
  GridValueFormatter,
} from "@mui/x-data-grid";

// Types
type Priority = "low" | "medium" | "high";

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

// Mock data - replace with real data from your API
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Vet Appointment",
    description: "Annual checkup and vaccinations",
    dueDate: "2023-12-15T14:30:00.000Z",
    priority: "high",
    status: "pending",
    petIds: ["1"],
    petNames: ["Max"],
    category: "Vet Visit",
    createdAt: "2023-11-01T10:00:00.000Z",
    updatedAt: "2023-11-01T10:00:00.000Z",
  },
  {
    id: "2",
    title: "Grooming",
    description: "Full grooming session",
    dueDate: "2023-12-05T10:00:00.000Z",
    priority: "medium",
    status: "in_progress",
    petIds: ["1"],
    petNames: ["Max"],
    category: "Grooming",
    createdAt: "2023-11-10T15:30:00.000Z",
    updatedAt: "2023-11-10T15:30:00.000Z",
  },
  {
    id: "3",
    title: "Buy Food",
    description: "Dry food and treats",
    dueDate: "2023-11-28T18:00:00.000Z",
    priority: "low",
    status: "pending",
    petIds: ["1", "2"],
    petNames: ["Max", "Bella"],
    category: "Shopping",
    createdAt: "2023-11-20T09:15:00.000Z",
    updatedAt: "2023-11-20T09:15:00.000Z",
  },
  {
    id: "4",
    title: "Deworming",
    description: "Monthly deworming treatment",
    dueDate: "2023-11-25T09:00:00.000Z",
    priority: "high",
    status: "overdue",
    petIds: ["1", "2"],
    petNames: ["Max", "Bella"],
    category: "Medication",
    createdAt: "2023-11-01T14:20:00.000Z",
    updatedAt: "2023-11-25T10:00:00.000Z",
  },
  {
    id: "5",
    title: "Training Session",
    description: "Obedience training",
    dueDate: "2023-12-20T16:00:00.000Z",
    priority: "medium",
    status: "pending",
    petIds: ["1"],
    petNames: ["Max"],
    category: "Training",
    createdAt: "2023-11-15T11:45:00.000Z",
    updatedAt: "2023-11-15T11:45:00.000Z",
  },
];

// Priority chip component
const PriorityChip = ({ priority }: { priority: Priority }) => {
  const priorityMap = {
    low: { label: "Low", color: "success" as const },
    medium: { label: "Medium", color: "warning" as const },
    high: { label: "High", color: "error" as const },
  };

  const { label, color } = priorityMap[priority];

  return <Chip label={label} size="small" color={color} variant="outlined" />;
};

// Status chip component
const StatusChip = ({ status }: { status: TaskStatus }) => {
  const statusMap = {
    pending: {
      label: "Pending",
      color: "default" as const,
      icon: <WarningIcon fontSize="small" />,
    },
    in_progress: {
      label: "In Progress",
      color: "primary" as const,
      icon: <WarningIcon fontSize="small" />,
    },
    completed: {
      label: "Completed",
      color: "success" as const,
      icon: <CheckCircleIcon fontSize="small" />,
    },
    overdue: {
      label: "Overdue",
      color: "error" as const,
      icon: <ErrorIcon fontSize="small" />,
    },
  };

  const { label, color, icon } = statusMap[status];

  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      color={color}
      variant="outlined"
      sx={{ minWidth: 110 }}
    />
  );
};

// Date cell component
const DateCell = ({ date }: { date: string }) => {
  const dueDate = parseISO(date);
  const today = new Date();

  let textColor = "text.primary";
  let dateText = format(dueDate, "MMM d, yyyy h:mm a");

  if (isToday(dueDate)) {
    textColor = "info.main";
    dateText = `Today, ${format(dueDate, "h:mm a")}`;
  } else if (isTomorrow(dueDate)) {
    textColor = "info.main";
    dateText = `Tomorrow, ${format(dueDate, "h:mm a")}`;
  } else if (isBefore(dueDate, today)) {
    textColor = "error.main";
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", color: textColor }}>
      <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
      <Typography variant="body2">{dateText}</Typography>
    </Box>
  );
};

// Pet avatars component
const PetAvatars = ({ petNames }: { petNames: string[] }) => {
  const theme = useTheme();

  if (!petNames || petNames.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No pets
      </Typography>
    );
  }

  return (
    <AvatarGroup
      max={3}
      sx={{
        "& .MuiAvatar-root": { width: 28, height: 28, fontSize: "0.8rem" },
      }}
    >
      {petNames.map((name, index) => (
        <Avatar
          key={index}
          alt={name}
          sx={{ bgcolor: theme.palette.primary.main }}
        >
          {name.charAt(0).toUpperCase()}
        </Avatar>
      ))}
    </AvatarGroup>
  );
};

// Task list component
const TaskList = () => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(mockTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "dueDate", sort: "asc" },
  ]);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // Get unique categories for filter
  const categories = Array.from(
    new Set(tasks.map((task) => task.category || "Uncategorized"))
  );

  // Apply filters and search
  useEffect(() => {
    let result = [...tasks];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term)) ||
          task.petNames?.some((name) => name.toLowerCase().includes(term)) ||
          task.category?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(
        (task) => (task.category || "Uncategorized") === categoryFilter
      );
    }

    setFilteredTasks(result);
    setPage(0); // Reset to first page when filters change
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Handle sort model change
  const handleSortModelChange = (newModel: GridSortModel) => {
    setSortModel(newModel);
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Toggle task status (complete/incomplete)
  const toggleTaskStatus = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "completed" ? "pending" : "completed",
              completedAt:
                task.status === "completed"
                  ? undefined
                  : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : task
      )
    );
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    }
  };

  // Define columns for the data grid
  const columns: GridColDef[] = [
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => <StatusChip status={params.row.status} />,
      sortable: false,
    },
    {
      field: "title",
      headerName: "Title",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="body2" fontWeight="medium">
            {params.row.title}
          </Typography>
          {params.row.description && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "pets",
      headerName: "Pets",
      width: 120,
      renderCell: (params) => (
        <PetAvatars petNames={params.row.petNames || []} />
      ),
      sortable: false,
    },
    {
      field: "category",
      headerName: "Category",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.row.category || "Uncategorized"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 120,
      renderCell: (params) => <PriorityChip priority={params.row.priority} />,
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 200,
      renderCell: (params) => <DateCell date={params.row.dueDate} />,
      valueFormatter: (value: string) =>
        value ? format(parseISO(value), "yyyy-MM-dd HH:mm") : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              component={Link}
              to={`/tasks/${params.row.id}/edit`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => deleteTask(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Card>
        <CardHeader
          title="Tasks"
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              to="/tasks/new"
            >
              Add Task
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="priority-filter-label">Priority</InputLabel>
                <Select
                  labelId="priority-filter-label"
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="category-filter-label">Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                }}
                sx={{ height: "56px" }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={filteredTasks}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              // You can also move rowsPerPageOptions into the paginationModel
              // or use the slots props to customize the pagination controls.
              slots={{
                toolbar: () => (
                  <Toolbar sx={{ p: 0, mb: 1 }}>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{ flexGrow: 1 }}
                    >
                      {filteredTasks.length}{" "}
                      {filteredTasks.length === 1 ? "task" : "tasks"}
                    </Typography>
                  </Toolbar>
                ),
              }}
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: theme.palette.grey[100],
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TaskList;
