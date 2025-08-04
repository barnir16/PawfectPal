import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  Avatar,
  FormControlLabel,
  Switch,
  FormGroup,
  FormLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  AddAPhoto as AddPhotoIcon,
  Pets as PetIcon,
  Cake as CakeIcon,
  Scale as ScaleIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data - replace with real data from your API
const petTypes = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Hamster", "Other"];
const dogBreeds = [
  "Labrador Retriever",
  "German Shepherd",
  "Golden Retriever",
  "French Bulldog",
  "Bulldog",
  "Poodle",
  "Beagle",
  "Rottweiler",
  "Other",
];

const catBreeds = [
  "Siamese",
  "Persian",
  "Maine Coon",
  "Ragdoll",
  "Bengal",
  "Sphynx",
  "British Shorthair",
  "Other",
];

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  type: z.string().min(1, "Please select a pet type"),
  breed: z.string().min(1, "Please select or enter a breed"),
  gender: z.string().min(1, "Please select a gender"),
  birthDate: z.date({
    required_error: "Please select a birth date",
    invalid_type_error: "That's not a valid date!",
  }),
  weight: z
    .number()
    .min(0.1, "Weight must be greater than 0")
    .max(200, "Weight seems too high"),
  weightUnit: z.string(),
  color: z.string().optional(),
  microchipNumber: z.string().optional(),
  isNeutered: z.boolean(),
  notes: z.string().optional(),
  // In a real app, this would be a file upload or URL to the stored image
  image: z.string().optional(),
});

type PetFormData = z.infer<typeof schema>;

export const PetForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const [breeds, setBreeds] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<PetFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      breed: "",
      gender: "",
      birthDate: new Date(),
      weight: 0,
      weightUnit: "kg",
      color: "",
      microchipNumber: "",
      isNeutered: false,
      notes: "",
      image: "",
    },
  });

  const watchType = watch("type");
  const watchImage = watch("image");

  // Update breeds when pet type changes
  useEffect(() => {
    if (watchType === "Dog") {
      setBreeds(dogBreeds);
    } else if (watchType === "Cat") {
      setBreeds(catBreeds);
    } else {
      setBreeds(["Other"]);
    }
    // Reset breed when type changes
    setValue("breed", "");
  }, [watchType, setValue]);

  // Load pet data if editing
  useEffect(() => {
    if (isEditing) {
      // In a real app, you would fetch the pet data from your API
      const fetchPet = async () => {
        try {
          // Mock API call
          // const response = await fetch(`/api/pets/${id}`);
          // const petData = await response.json();

          // Mock data for demo
          const petData = {
            id,
            name: "Max",
            type: "Dog",
            breed: "Golden Retriever",
            gender: "male",
            birthDate: "2020-05-15T00:00:00.000Z",
            weight: 28.5,
            weightUnit: "kg",
            color: "Golden",
            microchipNumber: "123456789012345",
            isNeutered: true,
            notes: "Loves to play fetch and swim",
            image: "/placeholder-dog.jpg",
          };

          // Set form values
          reset({
            ...petData,
            birthDate: parseISO(petData.birthDate),
          });

          // Set image preview if image exists
          if (petData.image) {
            setImagePreview(petData.image);
          }
        } catch (error) {
          console.error("Error loading pet:", error);
        }
      };

      fetchPet();
    }
  }, [id, isEditing, reset]);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to your server
      // and get back a URL to store in your database
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        setValue("image", imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<PetFormData> = async (data) => {
    try {
      // Format the birth date for the API
      const formattedData = {
        ...data,
        birthDate: format(data.birthDate, "yyyy-MM-dd"),
      };

      console.log("Submitting pet:", formattedData);

      // In a real app, you would make an API call here
      // const method = isEditing ? 'PUT' : 'POST';
      // const url = isEditing ? `/api/pets/${id}` : '/api/pets';
      // const response = await fetch(url, {
      //   method,
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formattedData),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to save pet');
      // }

      // Show success message and navigate back
      // enqueueSnackbar(`Pet ${isEditing ? 'updated' : 'added'} successfully!`, {
      //   variant: 'success',
      // });

      navigate("/pets");
    } catch (error) {
      console.error("Error saving pet:", error);
      // enqueueSnackbar('Failed to save pet. Please try again.', {
      //   variant: 'error',
      // });
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this pet? This action cannot be undone."
      )
    ) {
      try {
        // In a real app, you would make an API call to delete the pet
        // await fetch(`/api/pets/${id}`, { method: 'DELETE' });

        // Show success message and navigate back
        // enqueueSnackbar('Pet deleted successfully!', { variant: 'success' });

        navigate("/pets");
      } catch (error) {
        console.error("Error deleting pet:", error);
        // enqueueSnackbar('Failed to delete pet. Please try again.', {
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
              {isEditing ? "Edit Pet" : "Add New Pet"}
            </Typography>
          </Box>
          {isEditing && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete Pet
            </Button>
          )}
        </Box>

        <Card>
          <CardHeader title="Pet Information" />
          <Divider />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Pet Photo */}
                <Grid item xs={12} md={4} lg={3}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Avatar
                      src={imagePreview || undefined}
                      alt="Pet"
                      sx={{
                        width: 150,
                        height: 150,
                        mb: 2,
                        bgcolor: "primary.light",
                        "& .MuiSvgIcon-root": {
                          fontSize: 60,
                        },
                      }}
                    >
                      {!imagePreview && <PetIcon />}
                    </Avatar>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="pet-photo-upload"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="pet-photo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<AddPhotoIcon />}
                      >
                        {imagePreview ? "Change Photo" : "Add Photo"}
                      </Button>
                    </label>
                  </Box>
                </Grid>

                <Grid item xs={12} md={8} lg={9}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Pet's Name"
                            variant="outlined"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PetIcon
                                    color={errors.name ? "error" : "inherit"}
                                  />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.type}>
                        <InputLabel id="pet-type-label">Type</InputLabel>
                        <Controller
                          name="type"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              labelId="pet-type-label"
                              label="Type"
                            >
                              {petTypes.map((type) => (
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

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.breed}>
                        <InputLabel id="breed-label">Breed</InputLabel>
                        <Controller
                          name="breed"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              labelId="breed-label"
                              label="Breed"
                              disabled={!watchType}
                            >
                              {breeds.map((breed) => (
                                <MenuItem key={breed} value={breed}>
                                  {breed}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors.breed && (
                          <FormHelperText>
                            {errors.breed.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.gender}>
                        <InputLabel id="gender-label">Gender</InputLabel>
                        <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              labelId="gender-label"
                              label="Gender"
                              startAdornment={
                                <InputAdornment position="start">
                                  {field.value === "female" ? (
                                    <FemaleIcon
                                      color={
                                        errors.gender ? "error" : "inherit"
                                      }
                                    />
                                  ) : (
                                    <MaleIcon
                                      color={
                                        errors.gender ? "error" : "inherit"
                                      }
                                    />
                                  )}
                                </InputAdornment>
                              }
                            >
                              <MenuItem value="female">Female</MenuItem>
                              <MenuItem value="male">Male</MenuItem>
                            </Select>
                          )}
                        />
                        {errors.gender && (
                          <FormHelperText>
                            {errors.gender.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="birthDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Birth Date"
                            value={field.value}
                            onChange={(date) => field.onChange(date)}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.birthDate,
                                helperText: errors.birthDate?.message,
                                InputProps: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <CakeIcon
                                        color={
                                          errors.birthDate ? "error" : "inherit"
                                        }
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

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Controller
                          name="weight"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Weight"
                              type="number"
                              inputProps={{
                                step: "0.1",
                                min: "0.1",
                                max: "200",
                              }}
                              error={!!errors.weight}
                              helperText={errors.weight?.message}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <ScaleIcon
                                      color={
                                        errors.weight ? "error" : "inherit"
                                      }
                                    />
                                  </InputAdornment>
                                ),
                              }}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          )}
                        />
                        <Controller
                          name="weightUnit"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Unit"
                              sx={{ minWidth: 100 }}
                            >
                              <MenuItem value="kg">kg</MenuItem>
                              <MenuItem value="lbs">lbs</MenuItem>
                            </Select>
                          )}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="color"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Color/Markings"
                            variant="outlined"
                            error={!!errors.color}
                            helperText={errors.color?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="microchipNumber"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Microchip Number"
                            variant="outlined"
                            error={!!errors.microchipNumber}
                            helperText={errors.microchipNumber?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">
                          Spayed/Neutered
                        </FormLabel>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Controller
                                name="isNeutered"
                                control={control}
                                render={({ field }) => (
                                  <Switch
                                    checked={field.value}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                    color="primary"
                                  />
                                )}
                              />
                            }
                            label={watch("isNeutered") ? "Yes" : "No"}
                          />
                        </FormGroup>
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
                            rows={3}
                            error={!!errors.notes}
                            helperText={errors.notes?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
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
                      {isSubmitting ? "Saving..." : "Save Pet"}
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

export default PetForm;
