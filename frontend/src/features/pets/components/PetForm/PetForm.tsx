import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

// Import our new components
import { PetImageUpload } from "./../../../../components/pets/PetImageUpload";
import { PetBasicInfoForm } from "./../../../../components/pets/PetBasicInfoForm";
import { PetDetailsForm } from "./../../../../components/pets/PetDetailsForm";
import { PetMedicalInfo } from "./../../../../components/pets/PetMedicalInfo";
import { FormActionButtons } from "./../../../../components/pets/FormActionButtons";

// Mock data - in a real app, these would come from an API
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

// Define our form schema using Zod
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
    .number({
      invalid_type_error: "Weight must be a number",
    })
    .min(0.1, "Weight must be greater than 0")
    .max(200, "Weight seems too high"),
  weightUnit: z.string(),
  color: z.string().optional(),
  microchipNumber: z.string().optional(),
  isNeutered: z.boolean(),
  notes: z.string().optional(),
  image: z.string().optional(),
});

export type PetFormData = z.infer<typeof schema>;

export const PetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const [breeds, setBreeds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  // Update breeds when pet type changes
  useEffect(() => {
    if (watchType === "Dog") {
      setBreeds(dogBreeds);
    } else if (watchType === "Cat") {
      setBreeds(catBreeds);
    } else {
      setBreeds(["Other"]);
    }
    setValue("breed", "");
  }, [watchType, setValue]);

  // Load pet data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchPet = async () => {
        try {
          // In a real app, this would be an API call
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

          reset({
            ...petData,
            birthDate: parseISO(petData.birthDate),
          });

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

  const handleImageUpload = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        setValue("image", imageUrl);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setValue("image", "");
    }
  };

  const onSubmit = async (data: PetFormData) => {
    try {
      const formattedData = {
        ...data,
        birthDate: format(data.birthDate, "yyyy-MM-dd"),
        // In a real app, you would handle the image file upload here
        image: imageFile || data.image,
      };

      console.log("Submitting pet:", formattedData);
      // In a real app, you would make an API call here
      // await api.savePet(formattedData);

      navigate("/pets");
    } catch (error) {
      console.error("Error saving pet:", error);
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this pet? This action cannot be undone."
      )
    ) {
      try {
        console.log(`Deleting pet with ID: ${id}`);
        // In a real app, you would make an API call here
        // await api.deletePet(id);
        navigate("/pets");
      } catch (error) {
        console.error("Error deleting pet:", error);
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
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Left column - Image upload */}
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <Card>
                <CardHeader title="Pet Photo" />
                <Divider />
                <CardContent>
                  <PetImageUpload
                    imageUrl={imagePreview}
                    onChange={handleImageUpload}
                    onRemove={() => handleImageUpload(null)}
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Right column - Form fields */}
            <Grid size={{ xs: 12, md: 8, lg: 9 }}>
              <Card>
                <CardHeader title="Basic Information" />
                <Divider />
                <CardContent>
                  <PetBasicInfoForm
                    control={control}
                    errors={errors}
                    petTypes={petTypes}
                    breeds={breeds}
                    isSubmitting={isSubmitting}
                  />
                </CardContent>
              </Card>

              <Box mt={3}>
                <Card>
                  <CardHeader title="Physical Details" />
                  <Divider />
                  <CardContent>
                    <PetDetailsForm
                      control={control}
                      errors={errors}
                      isSubmitting={isSubmitting}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box mt={3}>
                <Card>
                  <CardHeader title="Medical Information" />
                  <Divider />
                  <CardContent>
                    <PetMedicalInfo
                      control={control}
                      errors={errors}
                      isSubmitting={isSubmitting}
                    />
                  </CardContent>
                </Card>
              </Box>

              {/* Form actions */}
              <Box mt={3}>
                <FormActionButtons
                  isEditing={isEditing}
                  isSubmitting={isSubmitting}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  submitButtonText={isEditing ? "Update Pet" : "Add Pet"}
                />
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default PetForm;
