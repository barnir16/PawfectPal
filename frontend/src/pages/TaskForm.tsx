import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
  Pets as PetIcon,
  PriorityHigh as PriorityIcon,
  Repeat as RepeatIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with real data from your API
const mockPets = [
  { id: 1, name: "Max" },
  { id: 2, name: "Bella" },
  { id: 3, name: "Charlie" },
];

const taskTypes = [
  "Feeding",
  "Medication",
  "Vet Visit",
  "Grooming",
  "Exercise",
  "Training",
  "Other",
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const repeatOptions = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  petId: z.string().min(1, "Please select a pet"),
  type: z.string().min(1, "Please select a task type"),
  priority: z.string().min(1, "Please select a priority"),
  date: z.date({
    required_error: "Please select a date",
    invalid_type_error: "That's not a date!",
  }),
  time: z.date({
    required_error: "Please select a time",
    invalid_type_error: "That's not a valid time!",
  }),
  repeat: z.string(),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof schema>;

export const TaskForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      petId: "",
      type: "",
      priority: "medium",
      date: new Date(),
      time: new Date(),
      repeat: "none",
      notes: "",
    },
  });

  // Load task data if editing
  useEffect(() => {
    if (isEditing) {
      // In a real app, you would fetch the task data from your API
      const fetchTask = async () => {
        try {
          // Mock API call
          // const response = await fetch(`/api/tasks/${id}`);
          // const taskData = await response.json();

          // Mock data for demo
          const taskData = {
            id,
            title: "Vet Appointment",
            description: "Annual checkup and vaccinations",
            petId: "1",
            type: "Vet Visit",
            priority: "high",
            date: "2023-12-15T00:00:00.000Z",
            time: "2023-12-15T14:30:00.000Z",
            repeat: "none",
            notes: "Bring medical records",
          };

          // Set form values
          reset({
            ...taskData,
            date: parseISO(taskData.date),
            time: parseISO(taskData.time),
          });
        } catch (error) {
          console.error("Error loading task:", error);
        }
      };

      fetchTask();
    }
  }, [id, isEditing, reset]);

  const onSubmit: SubmitHandler<TaskFormData> = async (data) => {
    try {
      // Format the date and time for the API
      const date = format(data.date, "yyyy-MM-dd");
      const time = format(data.time, "HH:mm:ss");

      const taskData = {
        ...data,
        date,
        time,
        // Convert date to ISO string for the API
        dueDate: new Date(`${date}T${time}`).toISOString(),
      };

      console.log("Submitting task:", taskData);

      // In a real app, you would make an API call here
      // const method = isEditing ? 'PUT' : 'POST';
      // const url = isEditing ? `/api/tasks/${id}` : '/api/tasks';
      // const response = await fetch(url, {
      //   method,
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(taskData),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to save task');
      // }

      // Show success message and navigate back
      // enqueueSnackbar(`Task ${isEditing ? 'updated' : 'created'} successfully!`, {
      //   variant: 'success',
      // });

      navigate("/tasks");
    } catch (error) {
      console.error("Error saving task:", error);
      // enqueueSnackbar('Failed to save task. Please try again.', {
      //   variant: 'error',
      // });
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      try {
        // In a real app, you would make an API call to delete the task
        // await fetch(`/api/tasks/${id}`, { method: 'DELETE' });

        // Show success message and navigate back
        // enqueueSnackbar('Task deleted successfully!', { variant: 'success' });

        navigate("/tasks");
      } catch (error) {
        console.error("Error deleting task:", error);
        // enqueueSnackbar('Failed to delete task. Please try again.', {
        //   variant: 'error',
        // });
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              {isEditing ? "Edit Task" : "Add New Task"}
            </Typography>
          </Box>
          {isEditing && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete Task
            </Button>
          )}
        </Box>

        <Card>
          <CardHeader title="Task Details" />
          <Divider />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
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
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
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

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!errors.petId}>
                    <InputLabel id="pet-label">Pet</InputLabel>
                    <Controller
                      name="petId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="pet-label"
                          label="Pet"
                          startAdornment={
                            <InputAdornment position="start">
                              <PetIcon
                                color={errors.petId ? "error" : "inherit"}
                              />
                            </InputAdornment>
                          }
                        >
                          {mockPets.map((pet) => (
                            <MenuItem key={pet.id} value={pet.id.toString()}>
                              {pet.name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.petId && (
                      <FormHelperText>{errors.petId.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel id="type-label">Task Type</InputLabel>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="type-label"
                          label="Task Type"
                          startAdornment={
                            <InputAdornment position="start">
                              <NotesIcon
                                color={errors.type ? "error" : "inherit"}
                              />
                            </InputAdornment>
                          }
                        >
                          {taskTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.type && (
                      <FormHelperText>{errors.type.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Date"
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.date,
                            helperText: errors.date?.message,
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarIcon
                                    color={errors.date ? "error" : "inherit"}
                                  />
                                </InputAdornment>
                              ),
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name="time"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        label="Time"
                        value={field.value}
                        onChange={(time) => field.onChange(time)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.time,
                            helperText: errors.time?.message,
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <TimeIcon
                                    color={errors.time ? "error" : "inherit"}
                                  />
                                </InputAdornment>
                              ),
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth error={!!errors.priority}>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="priority-label"
                          label="Priority"
                          startAdornment={
                            <InputAdornment position="start">
                              <PriorityIcon
                                color={errors.priority ? "error" : "inherit"}
                              />
                            </InputAdornment>
                          }
                        >
                          {priorities.map((priority) => (
                            <MenuItem
                              key={priority.value}
                              value={priority.value}
                            >
                              {priority.label}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.priority && (
                      <FormHelperText>{errors.priority.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="repeat-label">Repeat</InputLabel>
                    <Controller
                      name="repeat"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="repeat-label"
                          label="Repeat"
                          startAdornment={
                            <InputAdornment position="start">
                              <RepeatIcon />
                            </InputAdornment>
                          }
                        >
                          {repeatOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Additional Notes"
                        variant="outlined"
                        multiline
                        rows={2}
                        error={!!errors.notes}
                        helperText={errors.notes?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Task"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default TaskForm;
