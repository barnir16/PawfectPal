import { type Control, Controller, type FieldErrors } from "react-hook-form";
import {
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import type { TaskFormData } from "./../../features/tasks/components/TaskForm/TaskForm";

type TaskBasicInfoProps = {
  control: Control<TaskFormData>;
  errors: FieldErrors<TaskFormData>;
  pets: Array<{ id: number; name: string }>;
  taskTypes: string[];
  priorities: Array<{ value: string; label: string }>;
};

export const TaskBasicInfo = ({
  control,
  errors,
  pets,
  taskTypes,
  priorities,
}: TaskBasicInfoProps) => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Task Title"
              variant="outlined"
              error={!!errors.title}
              helperText={errors.title?.message}
              required
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="petId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.petId} required>
              <InputLabel>Pet</InputLabel>
              <Select {...field} label="Pet">
                {pets.map((pet) => (
                  <MenuItem key={pet.id} value={pet.id.toString()}>
                    {pet.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.petId && (
                <FormHelperText>{errors.petId.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.type} required>
              <InputLabel>Task Type</InputLabel>
              <Select {...field} label="Task Type">
                {taskTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <FormHelperText>{errors.type.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.priority} required>
              <InputLabel>Priority</InputLabel>
              <Select {...field} label="Priority">
                {priorities.map((priority) => (
                  <MenuItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.priority && (
                <FormHelperText>{errors.priority.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default TaskBasicInfo;
