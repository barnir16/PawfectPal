import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../../../contexts/AuthContext";
import { useLocalization } from "../../../../contexts/LocalizationContext";
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
import { PetImageUpload } from "../../../../components/pets/PetImageUpload";
import { PetBasicInfoForm } from "../../../../components/pets/PetBasicInfoForm";
import { PetDetailsForm } from "../../../../components/pets/PetDetailsForm";
import { PetMedicalInfo } from "../../../../components/pets/PetMedicalInfo";
import { FormActionButtons } from "../../../../components/pets/FormActionButtons";

// Import API services
import { createPet, updatePet, getPet } from "../../../../services/pets/petService";

// Import types
import type { Pet, PetType, PetGender } from "../../../../types/pets/pet";

// Pet types - standard supported types plus "other"
const petTypes: PetType[] = ["dog", "cat", "other"];

// Import breed fetching
import { fetchDogBreeds, fetchCatBreeds } from "../../../../services/external/externalApiService";



// Define our form schema using Zod
const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  type: z.string().min(1, "Please select a pet type"),
  breed: z.string().min(1, "Please select or enter a breed"),
  gender: z.string().min(1, "Please select a gender"),
  ageType: z.enum(["birthday", "age"]),
  birthDate: z.date().optional(),
  age: z.number().min(0).max(30).optional(),
  weight: z
    .number({
      invalid_type_error: "Weight must be a number",
    })
    .min(0.1, "Weight must be greater than 0")
    .max(200, "Weight seems too high")
    .optional(),
  weightUnit: z.string(),
  color: z.string().optional(),
  microchipNumber: z.string().optional(),
  isNeutered: z.boolean(),
  notes: z.string().optional(),
  healthIssues: z.array(z.string()).optional(),
  behaviorIssues: z.array(z.string()).optional(),
  image: z.string().optional(),
}).refine((data) => {
  if (data.ageType === "birthday" && !data.birthDate) {
    return false;
  }
  if (data.ageType === "age" && (data.age === undefined || data.age < 0)) {
    return false;
  }
  return true;
}, {
  message: "Please provide either a birth date or age",
  path: ["ageType"]
});

export type PetFormData = z.infer<typeof schema>;

export const PetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { forceLogout } = useAuth();
  const { t } = useLocalization();
  const isEditing = !!id;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [breeds, setBreeds] = useState<string[]>([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [breedError, setBreedError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<PetFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      breed: "",
      gender: "",
      ageType: "birthday" as const,
      birthDate: new Date(),
      age: undefined,
      weight: undefined,
      weightUnit: "kg",
      color: "",
      microchipNumber: "",
      isNeutered: false,
      notes: "",
      healthIssues: [],
      behaviorIssues: [],
      image: "",
    },
  });

  const selectedPetType = watch("type");
  const selectedBreed = watch("breed");

  // Fetch breeds when pet type changes - start with "Other" option
  useEffect(() => {
    if (!selectedPetType || selectedPetType === "other") {
      setBreeds([]);
      return;
    }

    // Start with "Other" option always available
    setBreeds(["Other"]);
    setLoadingBreeds(false);
    setBreedError(null);
  }, [selectedPetType]);

  // Fetch breeds when user types in breed field (3+ characters)
  useEffect(() => {
    const searchBreeds = async () => {
      if (!selectedPetType || selectedPetType === "other" || !selectedBreed) {
        setBreeds(["Other"]);
        return;
      }

      // Only search if we have 3+ characters
      if (selectedBreed.length < 3) {
        setBreeds(["Other"]);
        return;
      }

      setLoadingBreeds(true);
      setBreedError(null);

      try {
        let fetchedBreeds: string[] = [];
        if (selectedPetType === "dog") {
          console.log('🔍 Searching for dog breeds with:', selectedBreed);
          fetchedBreeds = await fetchDogBreeds(selectedBreed);
        } else if (selectedPetType === "cat") {
          console.log('🔍 Searching for cat breeds with:', selectedBreed);
          fetchedBreeds = await fetchCatBreeds(selectedBreed);
        }
        
        console.log('🔍 Search results:', fetchedBreeds);
        
        // Always add "Other" option for manual entry
        fetchedBreeds.push("Other");
        setBreeds(fetchedBreeds);
      } catch (error) {
        console.error("Failed to search breeds:", error);
        setBreedError("Failed to search breeds. You can still enter a custom breed.");
        setBreeds(["Other"]);
      } finally {
        setLoadingBreeds(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(searchBreeds, 150);
    return () => clearTimeout(timeoutId);
  }, [selectedPetType, selectedBreed]);


  // Load pet data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchPet = async () => {
        try {
          const petData = await getPet(parseInt(id));
          
          reset({
            name: petData.name,
            type: petData.type,
            breed: petData.breed,
            gender: petData.gender,
            ageType: petData.isBirthdayGiven ? "birthday" : "age" as const,
            birthDate: petData.birthDate ? new Date(petData.birthDate) : new Date(),
            age: petData.age,
            weight: petData.weightKg,
            weightUnit: petData.weightUnit,
            color: petData.color,
            microchipNumber: petData.microchipNumber,
            isNeutered: petData.isNeutered,
            notes: petData.notes,
            healthIssues: petData.healthIssues || [],
            behaviorIssues: petData.behaviorIssues || [],
            image: petData.imageUrl,
          });

          if (petData.imageUrl) {
            setImagePreview(petData.imageUrl);
          }
        } catch (error) {
          console.error("Error loading pet:", error);
          alert(t('pets.failedToLoad'));
        }
      };
      fetchPet();
    }
  }, [id, isEditing, reset]);

  const handleImageUpload = (file: File | null) => {
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
      const formattedData: Omit<Pet, 'id'> = {
        name: data.name,
        type: data.type as PetType,
        breed: data.breed,
        gender: data.gender as PetGender,
        age: data.age,
        birthDate: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
        weightKg: data.weight || undefined,
        weightUnit: data.weightUnit as "kg" | "lb",
        color: data.color,
        microchipNumber: data.microchipNumber,
        isNeutered: data.isNeutered,
        notes: data.notes,
        imageUrl: data.image,
        // Health and behavior issues are already arrays
        healthIssues: Array.isArray(data.healthIssues) ? data.healthIssues : (data.healthIssues ? [data.healthIssues] : []),
        behaviorIssues: Array.isArray(data.behaviorIssues) ? data.behaviorIssues : (data.behaviorIssues ? [data.behaviorIssues] : []),
        isVaccinated: false,
        isMicrochipped: false,
        isTrackingEnabled: false,
        isLost: false,
        isActive: true,
        isBirthdayGiven: data.ageType === 'birthday',
        ownerId: 1, // This should come from auth context
      };

      console.log("Submitting pet:", formattedData);
      
      if (isEditing && id) {
        await updatePet(parseInt(id), formattedData);
        alert(t('pets.petUpdated'));
      } else {
        await createPet(formattedData);
        alert(t('pets.petCreated'));
      }

      navigate("/pets");
    } catch (error: any) {
      console.error("Error saving pet:", error);
      
      // Handle authentication errors
      if (error?.isAuthError) {
        await forceLogout(t('pets.sessionExpired'));
        navigate("/auth");
        return;
      }
      
      alert(t('pets.errorSavingPet', { error: error.message || "Unknown error occurred" }));
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        t('pets.deleteConfirmation')
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
              {isEditing ? t('pets.editPet') : t('pets.addNewPet')}
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Left column - Image upload and breed info */}
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <Card>
                <CardHeader title={t('pets.petPhoto')} />
                <Divider />
                <CardContent>
                  <PetImageUpload
                    imageUrl={imagePreview}
                    onChange={handleImageUpload}
                    onRemove={() => handleImageUpload(null)}
                    disabled={isSubmitting}
                  />
                  
                  {/* Breed Information */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {t('pets.breedInfo')}
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>{t('pets.type')}:</strong> {watch('type') || t('pets.notSpecified')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>{t('pets.breed')}:</strong> {watch('breed') || t('pets.notSpecified')}
                      </Typography>
                      {watch('type') && watch('type') !== 'other' && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                          💡 <strong>Tip:</strong> {watch('type') === 'dog' 
                            ? 'Dogs need regular exercise, training, and socialization. Consider their energy level and size when planning activities.'
                            : 'Cats are independent but need mental stimulation, proper nutrition, and regular veterinary care.'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right column - Form fields */}
            <Grid size={{ xs: 12, md: 8, lg: 9 }}>
              <Card>
                                  <CardHeader title={t('pets.basicInformation')} />
                <Divider />
                <CardContent>
                  <PetBasicInfoForm
                    control={control}
                    errors={errors}
                    petTypes={petTypes}
                    breeds={breeds}
                    isSubmitting={isSubmitting}
                    loadingBreeds={loadingBreeds}
                    breedError={breedError}
                  />
                </CardContent>
              </Card>

              <Box mt={3}>
                <Card>
                  <CardHeader title={t('pets.physicalDetails')} />
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
                  <CardHeader title={t('pets.medicalInformation')} />
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
                  submitButtonText={isEditing ? t('pets.updatePet') : t('pets.addPet')}
                />
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    );
};

export default PetForm;
