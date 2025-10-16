import { TextField, MenuItem, Box } from "@mui/material";
import { useLocalization } from "../../../contexts/LocalizationContext";

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
  statusOptions,
  priorityOptions,
  petOptions,
}: TaskFiltersProps) => {
  const { t } = useLocalization();
  
  // Default options using t() function
  const defaultStatusOptions = [
    { value: 'all', label: t('tasks.allStatuses') },
    { value: 'completed', label: t('tasks.completed') },
    { value: 'pending', label: t('tasks.pending') },
  ];
  
  const defaultPriorityOptions = [
    { value: 'all', label: t('tasks.allPriorities') },
    { value: 'high', label: t('tasks.high') },
    { value: 'medium', label: t('tasks.medium') },
    { value: 'low', label: t('tasks.low') },
  ];
  
  const defaultPetOptions = [{ value: 'all', label: t('tasks.allPets') }];
  
  // Use provided options or defaults
  const finalStatusOptions = statusOptions || defaultStatusOptions;
  const finalPriorityOptions = priorityOptions || defaultPriorityOptions;
  const finalPetOptions = petOptions || defaultPetOptions;
  
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <TextField
        select
        label={t('tasks.status')}
        name="status"
        value={filters.status}
        onChange={onFilterChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        {finalStatusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t('tasks.priority')}
        name="priority"
        value={filters.priority}
        onChange={onFilterChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        {finalPriorityOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t('tasks.pet')}
        name="pet"
        value={filters.pet}
        onChange={onFilterChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        {finalPetOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default TaskFilters;
