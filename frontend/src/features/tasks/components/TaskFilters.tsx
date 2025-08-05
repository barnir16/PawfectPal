import { TextField, MenuItem, Box } from "@mui/material";

interface FilterOption {
  value: string;
  label: string;
}

interface TaskFiltersProps {
  filters: {
    status: string;
    priority: string;
    pet: string;
  };
  onFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  statusOptions?: FilterOption[];
  priorityOptions?: FilterOption[];
  petOptions?: FilterOption[];
}

export const TaskFilters = ({
  filters,
  onFilterChange,
  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
  ],
  priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ],
  petOptions = [{ value: 'all', label: 'All Pets' }],
}: TaskFiltersProps) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <TextField
        select
        label="Status"
        name="status"
        value={filters.status}
        onChange={onFilterChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Priority"
        name="priority"
        value={filters.priority}
        onChange={onFilterChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        {priorityOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Pet"
        name="pet"
        value={filters.pet}
        onChange={onFilterChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        {petOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default TaskFilters;
