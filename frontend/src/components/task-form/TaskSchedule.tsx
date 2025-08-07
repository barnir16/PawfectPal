import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { Grid, InputAdornment } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import type { TaskFormData } from "./../../features/tasks/components/TaskForm/TaskForm";

type TaskScheduleProps = {
  control: Control<TaskFormData>;
  errors: FieldErrors<TaskFormData>;
};

export const TaskSchedule = ({ control, errors }: TaskScheduleProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                // Pass field props directly to the component
                {...field}
                label="Date"
                sx={{ width: "100%" }}
                // Use slotProps to customize the underlying TextField
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.date,
                    helperText: errors.date?.message,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="time"
            control={control}
            render={({ field }) => (
              <TimePicker
                // Pass field props directly to the component
                {...field}
                label="Time"
                sx={{ width: "100%" }}
                // Use slotProps to customize the underlying TextField
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.time,
                    helperText: errors.time?.message,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <TimeIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default TaskSchedule;
