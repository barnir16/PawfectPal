import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Import our new components
import { TaskBasicInfo } from "./../../../../components/task-form/TaskBasicInfo";
import { TaskSchedule } from "./../../../../components/task-form/TaskSchedule";
import { TaskRecurrence } from "./../../../../components/task-form/TaskRecurrence";
import { TaskAttachments } from "./../../../../components/task-form/TaskAttachments";
import { FormActions } from "./../../../../components/task-form/FormActions";

// Types and schemas
export type TaskFormData = z.infer<typeof schema>;

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

export const TaskForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const [attachments, setAttachments] = useState<
    Array<{ id: string; name: string; size: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      petId: "",
      type: "",
      priority: "medium",
      repeat: "none",
      notes: "",
      date: new Date(),
      time: new Date(),
    },
  });

  // Load task data if editing
  useEffect(() => {
    if (isEditing) {
      // Simulate API call to fetch task data
      const fetchTask = async () => {
        try {
          // const response = await api.get(`/tasks/${id}`);
          // const task = response.data;
          // Reset form with task data
          reset({
            // Map API response to form fields
            title: "Sample Task",
            description: "Sample description",
            petId: "1",
            type: "Vet Visit",
            priority: "medium",
            date: new Date(),
            time: new Date(),
            repeat: "none",
            notes: "",
          });
        } catch (error) {
          console.error("Error fetching task:", error);
          // Handle error (e.g., show error message)
        }
      };

      fetchTask();
    }
  }, [id, isEditing, reset]);

  const onSubmit: SubmitHandler<TaskFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        dueDate: format(new Date(data.date), "yyyy-MM-dd"),
        dueTime: format(new Date(data.time), "HH:mm"),
      };

      if (isEditing) {
        console.log("Updating task:", payload);
      } else {
        console.log("Creating task:", payload);
      }

      // Redirect to tasks list after successful submission
      navigate("/tasks");
    } catch (error) {
      console.error("Error saving task:", error);
      // Handle error (e.g., show error message)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      navigate(-1);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        console.log("Task deleted");
        navigate("/tasks");
      } catch (error) {
        console.error("Error deleting task:", error);
        // Handle error (e.g., show error message)
      }
    }
  };

  const handleFileUpload = (file: File) => {
    // In a real app, upload the file to your server
    const newFile = {
      id: Math.random().toString(36).slice(2, 9),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    };
    setAttachments((prev) => [...prev, newFile]);
  };

  const handleFileDelete = (fileId: string) => {
    setAttachments((prev) => prev.filter((file) => file.id !== fileId));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditing ? "Edit Task" : "Create New Task"}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader title="Task Details" />
          <CardContent>
            <TaskBasicInfo
              control={control}
              errors={errors}
              pets={mockPets}
              taskTypes={taskTypes}
              priorities={priorities}
            />
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardHeader title="Schedule" />
          <CardContent>
            <TaskSchedule control={control} errors={errors} />
            <TaskRecurrence control={control} repeatOptions={repeatOptions} />
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardHeader title="Notes & Attachments" />
          <CardContent>
            <TaskAttachments
              control={control}
              onFileUpload={handleFileUpload}
              onFileDelete={handleFileDelete}
              attachments={attachments}
            />
          </CardContent>
        </Card>

        <FormActions
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          onDelete={isEditing ? handleDelete : undefined}
        />
      </form>
    </LocalizationProvider>
  );
};

export default TaskForm;
