import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, CalendarToday as CalendarIcon, AccessTime as TimeIcon } from "@mui/icons-material";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocalization } from "../../../../contexts/LocalizationContext";

// Services and types
import { getPets } from "../../../../services/pets/petService";
import { createTask, updateTask, getTask } from "../../../../services/tasks/taskService";
import { createVaccination, updateVaccination, getVaccination } from "../../../../services/medical/vaccinationService";
import type { Pet } from "../../../../types/pets/pet";
import type { TaskCreateData } from "../../../../types/tasks/task";
import type { VaccinationCreate } from "../../../../types/medical/vaccination";

// Types and schemas
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  petIds: z.array(z.number()).min(1, "Please select at least one pet"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  repeatInterval: z.number().min(1).optional(),
  repeatUnit: z.enum(["daily", "weekly", "monthly", "yearly"]).or(z.literal("")).optional(),
  repeatEndDate: z.string().optional(),
  notes: z.string().optional(),
  // Vaccine-specific fields
  vaccineName: z.string().optional(),
  veterinarian: z.string().optional(),
  clinic: z.string().optional(),
  doseNumber: z.number().min(1).optional(),
  batchNumber: z.string().optional(),
  manufacturer: z.string().optional(),
});

export type TaskFormData = z.infer<typeof schema>;

export const TaskForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLocalization();
  const isEditing = !!id;
  const [isVaccineForm, setIsVaccineForm] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorities = [
    { value: "low", label: t('taskPriorities.low') },
    { value: "medium", label: t('taskPriorities.medium') },
    { value: "high", label: t('taskPriorities.high') },
    { value: "urgent", label: t('taskPriorities.urgent') },
  ];

  const repeatUnits = [
    { value: "daily", label: t('tasks.daily') },
    { value: "weekly", label: t('tasks.weekly') },
    { value: "monthly", label: t('tasks.monthly') },
    { value: "yearly", label: t('tasks.yearly') },
  ];

  // Check if this is a vaccine form
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'vaccine') {
      setIsVaccineForm(true);
    }
  }, [searchParams]);

  // Form setup - defaultValues depend on isVaccineForm state
  const defaultValues = {
    title: isVaccineForm ? "Vaccination Appointment" : "",
    description: "",
    petIds: [],
    priority: "medium" as const,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    repeatUnit: "" as const,
    repeatInterval: 1,
    repeatEndDate: "",
    notes: "",
    vaccineName: isVaccineForm ? "" : undefined,
    veterinarian: isVaccineForm ? "" : undefined,
    clinic: isVaccineForm ? "" : undefined,
    doseNumber: isVaccineForm ? 1 : undefined,
    batchNumber: isVaccineForm ? "" : undefined,
    manufacturer: isVaccineForm ? "" : undefined,
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load pets
        const petsData = await getPets();
        setPets(petsData);

        // If editing, load task data
        if (isEditing && id) {
          const taskData = await getTask(parseInt(id));
          const taskDate = new Date(taskData.dateTime);
          reset({
            title: taskData.title,
            description: taskData.description || "",
            petIds: taskData.petIds,
            priority: (taskData.priority as 'low' | 'medium' | 'high' | 'urgent') || "medium",
            date: taskDate.toISOString().split('T')[0],
            time: taskDate.toTimeString().slice(0, 5),
            repeatInterval: taskData.repeatInterval || 1,
            repeatUnit: taskData.repeatUnit || "",
            repeatEndDate: taskData.repeatEndDate || "",
            notes: taskData.description || "",
          });
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditing, reset]);

  // Helper function to calculate next due date for vaccines
  const calculateNextDueDate = (startDate: string, interval: number | undefined, unit: string | undefined): string => {
    if (!interval || !unit || unit === "") {
      const defaultDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      return defaultDate.toISOString().split('T')[0] + 'T00:00:00.000Z'; // Default to 1 year with zero time
    }

    const start = new Date(startDate + 'T00:00:00.000Z');
    let nextDue = new Date(start);

    switch (unit) {
      case 'daily':
        nextDue.setDate(start.getDate() + interval);
        break;
      case 'weekly':
        nextDue.setDate(start.getDate() + (interval * 7));
        break;
      case 'monthly':
        nextDue.setMonth(start.getMonth() + interval);
        break;
      case 'yearly':
        nextDue.setFullYear(start.getFullYear() + interval);
        break;
      default:
        nextDue.setFullYear(start.getFullYear() + 1); // Default to 1 year
    }

    return nextDue.toISOString().split('T')[0] + 'T00:00:00.000Z';
  };

  const onSubmit: SubmitHandler<TaskFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (isVaccineForm) {
        // Create vaccine record
        if (data.petIds.length === 0) {
          setError("Please select at least one pet for the vaccine");
          return;
        }

        // Validate required vaccine fields
        if (!data.vaccineName || !data.veterinarian || !data.clinic || !data.doseNumber) {
          setError("Please fill in all required vaccine fields (name, veterinarian, clinic, dose number)");
          return;
        }

        // For vaccine forms, we need to create a vaccine record for each selected pet
        for (const petId of data.petIds) {
          const vaccineData: VaccinationCreate = {
            petId: petId,
            vaccineName: data.vaccineName,
            dateAdministered: new Date(`${data.date}T00:00:00.000Z`).toISOString(),
            nextDueDate: data.repeatUnit && data.repeatInterval
              ? calculateNextDueDate(data.date, data.repeatInterval, data.repeatUnit)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z', // Default to 1 year with zero time
            veterinarian: data.veterinarian,
            clinic: data.clinic,
            doseNumber: data.doseNumber || 1,
            batchNumber: data.batchNumber,
            manufacturer: data.manufacturer,
            notes: data.notes,
            isCompleted: true,
            reminderSent: false,
          };

          await createVaccination(petId, vaccineData);
        }

        alert(isVaccineForm ? 'Vaccine record(s) created successfully!' : t('tasks.taskCreated'));
      } else {
        // Create task record
        const taskData: TaskCreateData = {
          title: data.title,
          description: data.description || "",
          dateTime: new Date(`${data.date}T${data.time}`).toISOString(),
          petIds: data.petIds,
          priority: data.priority,
          repeatInterval: data.repeatInterval,
          repeatUnit: data.repeatUnit === "" ? undefined : data.repeatUnit,
          repeatEndDate: data.repeatEndDate && data.repeatEndDate !== "" ? data.repeatEndDate : undefined,
          attachments: [],
          status: 'pending',
          isCompleted: false,
        };

        if (isEditing && id) {
          await updateTask(parseInt(id), taskData);
          alert(t('tasks.taskUpdated'));
        } else {
          await createTask(taskData);
          alert(isVaccineForm ? 'Vaccine appointment created successfully!' : t('tasks.taskCreated'));
        }
      }

      navigate("/tasks");
    } catch (err) {
      console.error('Error saving:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/tasks");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditing ? t('tasks.editTaskTitle') : isVaccineForm ? 'Add Vaccine' : t('tasks.addNewTask')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader title={isVaccineForm ? 'Vaccine Details' : t('tasks.taskDetails')} />
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={isVaccineForm ? 'Vaccine Title' : t('tasks.taskTitle')}
                      fullWidth
                      required
                      error={!!errors.title}
                      helperText={errors.title?.message}
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
                      label={t('tasks.description')}
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="petIds"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.petIds}>
                      <InputLabel>{t('tasks.selectPets')}</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label={t('tasks.selectPets')}
                        value={field.value || []}
                      >
                        {pets.map((pet) => (
                          <MenuItem key={pet.id} value={pet.id}>
                            {pet.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.petIds && (
                        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                          {errors.petIds.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>{t('tasks.priority')}</InputLabel>
                      <Select {...field} label={t('tasks.priority')} value={field.value || "medium"}>
                        {priorities.map((priority) => (
                          <MenuItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('tasks.date')}
                      type="date"
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <IconButton
                            size="small"
                            onClick={() => {
                              const input = document.querySelector('input[name="date"]') as HTMLInputElement;
                              if (input) input.showPicker();
                            }}
                            sx={{ mr: 1, p: 0.5 }}
                          >
                            <CalendarIcon sx={{ color: 'action.active' }} />
                          </IconButton>
                        ),
                      }}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      sx={{
                        '& input[type="date"]::-webkit-calendar-picker-indicator': {
                          display: 'none'
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="time"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('tasks.time')}
                      type="time"
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <IconButton
                            size="small"
                            onClick={() => {
                              const input = document.querySelector('input[name="time"]') as HTMLInputElement;
                              if (input) input.showPicker();
                            }}
                            sx={{ mr: 1, p: 0.5 }}
                          >
                            <TimeIcon sx={{ color: 'action.active' }} />
                          </IconButton>
                        ),
                      }}
                      error={!!errors.time}
                      helperText={errors.time?.message}
                      sx={{
                        '& input[type="time"]::-webkit-calendar-picker-indicator': {
                          display: 'none'
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="repeatUnit"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Repeat</InputLabel>
                      <Select {...field} label="Repeat" value={field.value || ""}>
                        <MenuItem value="">Never</MenuItem>
                        {repeatUnits.map((unit) => (
                          <MenuItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="repeatInterval"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('tasks.repeatInterval')}
                      type="number"
                      fullWidth
                      disabled={!watch('repeatUnit')}
                      inputProps={{ min: 1, max: 99 }}
                      value={field.value || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        field.onChange(value);
                      }}
                      helperText={watch('repeatUnit') ? `Every ${watch('repeatUnit')} (e.g., every 2 weeks)` : "Select repeat option first"}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="repeatEndDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('tasks.repeatEndDate')}
                      type="date"
                      fullWidth
                      disabled={!watch('repeatUnit')}
                      value={field.value || ""}
                      InputProps={{
                        startAdornment: (
                          <IconButton
                            size="small"
                            onClick={() => {
                              const input = document.querySelector('input[name="repeatEndDate"]') as HTMLInputElement;
                              if (input) input.showPicker();
                            }}
                            sx={{ mr: 1, p: 0.5 }}
                          >
                            <CalendarIcon sx={{ color: 'action.active' }} />
                          </IconButton>
                        ),
                      }}
                      sx={{
                        '& input[type="date"]::-webkit-calendar-picker-indicator': {
                          display: 'none'
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('tasks.notes')}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>

              {/* Vaccine-specific fields */}
              {isVaccineForm && (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="vaccineName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Vaccine Name"
                          fullWidth
                          required
                          error={!!errors.vaccineName}
                          helperText={errors.vaccineName?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="veterinarian"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Veterinarian"
                          fullWidth
                          required
                          error={!!errors.veterinarian}
                          helperText={errors.veterinarian?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="clinic"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Clinic"
                          fullWidth
                          required
                          error={!!errors.clinic}
                          helperText={errors.clinic?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="doseNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Dose Number"
                          type="number"
                          fullWidth
                          required
                          inputProps={{ min: 1 }}
                          value={field.value || 1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            field.onChange(value);
                          }}
                          error={!!errors.doseNumber}
                          helperText={errors.doseNumber?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="batchNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Batch Number"
                          fullWidth
                          error={!!errors.batchNumber}
                          helperText={errors.batchNumber?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="manufacturer"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Manufacturer"
                          fullWidth
                          error={!!errors.manufacturer}
                          helperText={errors.manufacturer?.message}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      isEditing ? t('tasks.updateTask') : isVaccineForm ? 'Add Vaccine' : t('tasks.createTask')
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TaskForm;