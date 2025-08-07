import { type Control, Controller } from "react-hook-form";
import { Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Repeat as RepeatIcon } from "@mui/icons-material";
import type { TaskFormData } from "./../../features/tasks/components/TaskForm/TaskForm";

type TaskRecurrenceProps = {
  control: Control<TaskFormData>;
  repeatOptions: Array<{ value: string; label: string }>;
};

export const TaskRecurrence = ({
  control,
  repeatOptions,
}: TaskRecurrenceProps) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Controller
        name="repeat"
        control={control}
        defaultValue="none"
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Repeat</InputLabel>
            <Select
              {...field}
              label="Repeat"
              startAdornment={<RepeatIcon color="action" sx={{ mr: 1 }} />}
            >
              {repeatOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />
    </Grid>
  );
};

export default TaskRecurrence;
