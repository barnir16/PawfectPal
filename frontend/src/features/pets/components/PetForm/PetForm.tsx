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

import { PetImageUpload } from "../../../../components/pets/PetImageUpload";
import { PetBasicInfoForm } from "../../../../components/pets/PetBasicInfoForm";
import { PetDetailsForm } from "../../../../components/pets/PetDetailsForm";
import { PetMedicalInfo } from "../../../../components/pets/PetMedicalInfo";
import { FormActionButtons } from "../../../../components/pets/FormActionButtons";
import { BreedInfoCard } from "../../../../components/pets/BreedInfoCard";

import {
  createPet,
  updatePet,
  getPet,
  uploadPetImage,
} from "../../../../services/pets/petService";

import type { Pet, PetType, PetGender } from "../../../../types/pets/pet";

const petTypes: PetType[] = ["dog", "cat", "other"];

import {
  fetchDogBreeds,
  fetchCatBreeds,
} from "../../../../services/external/externalApiService";

const schema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name is too long"),
    type: z.string().min(1, "Please select a pet type"),
    breed: z.string().min(1, "Please select or enter a breed"),
    gender: z.string().min(1, "Please select a gender"),
    ageType: z.enum(["birthday", "age"]),
    birthDate: z
      .date()
      .optional()
      .refine((date) => {
        if (!date) return true;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      }, "Birth date cannot be in the future"),
    age: z.number().min(0).max(30).optional(),
    // Optional birth month (1-12) for approximate age mode.
    // Stored alongside age so we can derive a more accurate birth_date.
    approxMonth: z.number().min(1).max(12).optional(),
    weight: z
      .union([
        z.number({ invalid_type_error: "Weight must be a number" })
          .min(0.1, "Weight must be greater than 0")
          .max(200, "Weight seems too high"),
        z.literal(""),
        z.literal(null),
      ])
      .optional()
      .transform((e) => (e === "" || e === null ? undefined : e)),
    weightUnit: z.string(),
    color: z.string().optional(),
    microchipNumber: z.string().optional(),
    isNeutered: z.boolean(),
    notes: z.string().optional(),
    healthIssues: z.array(z.string()).optional(),
    behaviorIssues: z.array(z.string()).optional(),
    image: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.ageType === "birthday" && !data.birthDate) return false;
      if (data.ageType === "age" && (data.age === undefined || data.age < 0)) return false;
      return true;
    },
    {
      message: "Please provide either a birth date or age",
      path: ["ageType"],
    }
  );

export type PetFormData = z.infer<typeof schema>;

export const PetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { forceLogout } = useAuth();
  const { t } = useLocalization();
  const isEditing = !!id;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [breeds, setBreeds] = useState<string[]>([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [breedError, setBreedError] = useState<string | null>(null);
  const [petData, setPetData] = useState<Pet | null>(null);

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
      approxMonth: undefined,
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

  useEffect(() => {
    if (!selectedPetType || selectedPetType === "other") {
      setBreeds([]);
      return;
    }

    const searchBreeds = async () => {
      setLoadingBreeds(true);
      setBreedError(null);
      try {
        let fetchedBreeds: string[] = [];
        if (selectedPetType === "dog") {
          fetchedBreeds = await fetchDogBreeds(selectedBreed || "");
        } else if (selectedPetType === "cat") {
          fetchedBreeds = await fetchCatBreeds(selectedBreed || "");
        }
        setBreeds(fetchedBreeds.length > 0 ? fetchedBreeds : ["Other"]);
      } catch (err) {
        console.error("Failed to fetch breeds:", err);
        setBreedError("Could not load breeds. You can still type a breed name.");
        setBreeds(["Other"]);
      } finally {
        setLoadingBreeds(false);
      }
    };

    const timeoutId = setTimeout(searchBreeds, 150);
    return () => clearTimeout(timeoutId);
  }, [selectedPetType, selectedBreed]);

  // Load pet data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchPet = async () => {
        try {
          const petData = await getPet(parseInt(id));
          setPetData(petData);

          // When a pet was saved with approximate age mode, we stored a derived
          // birth_date (not the raw age number). Recover age and month from it.
          let loadedAge = petData.age;
          let loadedApproxMonth: number | undefined = undefined;
          if (!petData.isBirthdayGiven && petData.birthDate) {
            const bd = new Date(petData.birthDate);
            loadedAge = new Date().getFullYear() - bd.getFullYear();
            const storedMonth = bd.getMonth() + 1; // 1-indexed
            // Only restore month if it wasn't the default (July = 7)
            loadedApproxMonth = storedMonth !== 7 ? storedMonth : undefined;
          }

          reset({
            name: petData.name,
            type: petData.type,
            breed: petData.breed,
            gender: petData.gender,
            ageType: petData.isBirthdayGiven ? "birthday" : ("age" as const),
            birthDate: petData.isBirthdayGiven && petData.birthDate
              ? new Date(petData.birthDate)
              : new Date(),
            age: loadedAge,
            approxMonth: loadedApproxMonth,
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
            setImagePreview(petData.imageUrl || null);
          } else {
            setImagePreview(null);
          }
        } catch (error) {
          console.error("Failed to load pet for editing:", error);
          alert(t("pets.failedToLoad"));
        }
      };
      fetchPet();
    }
  }, [id, isEditing, reset]);

  const handleImageUpload = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: PetFormData) => {
    try {
      // Derive a birth_date from age input so it stays accurate over time.
      // Exact birthday mode: use the date as-is.
      // Approximate age mode: compute year from age, use provided month or July.
      //   Storing as birth_date means formatPetAge() always calculates dynamically
      //   and the displayed age increments each birthday without any manual update.
      let birthDateStr: string | undefined;
      if (data.ageType === "birthday") {
        birthDateStr = data.birthDate
          ? data.birthDate.toISOString().split("T")[0]
          : undefined;
      } else if (data.age !== undefined) {
        const birthYear = new Date().getFullYear() - Math.floor(data.age);
        // Use provided month, fall back to July (mid-year) for a neutral estimate
        const birthMonth = data.approxMonth ? data.approxMonth - 1 : 6; // 0-indexed
        birthDateStr = `${birthYear}-${String(birthMonth + 1).padStart(2, "0")}-01`;
      }

      const formattedData: Omit<Pet, "id"> = {
        name: data.name,
        type: data.type as PetType,
        breed: data.breed,
        gender: data.gender as PetGender,
        // Always use birthDate going forward; raw age is no longer stored
        age: undefined,
        birthDate: birthDateStr,
        weightKg: data.weight || undefined,
        weightUnit: data.weightUnit as "kg" | "lb",
        color: data.color,
        microchipNumber: data.microchipNumber,
        isNeutered: data.isNeutered,
        notes: data.notes,
        imageUrl: imagePreview || petData?.imageUrl || "",
        healthIssues: Array.isArray(data.healthIssues)
          ? data.healthIssues
          : data.healthIssues
          ? [data.healthIssues]
          : [],
        behaviorIssues: Array.isArray(data.behaviorIssues)
          ? data.behaviorIssues
          : data.behaviorIssues
          ? [data.behaviorIssues]
          : [],
        isVaccinated: false,
        isMicrochipped: false,
        isTrackingEnabled: false,
        isLost: false,
        isActive: true,
        isBirthdayGiven: data.ageType === "birthday",
        ownerId: 1,
      };

      let petId: number;
      if (isEditing && id) {
        const updatedPet = await updatePet(parseInt(id), formattedData);
        petId = updatedPet.id;
        alert(t("pets.petUpdated"));
      } else {
        const newPet = await createPet(formattedData);
        petId = newPet.id;
        alert(t("pets.petCreated"));
      }

      if (imageFile) {
        try {
          setIsUploadingImage(true);
          await uploadPetImage(petId, imageFile);
        } catch (uploadError) {
          console.error("Failed to upload pet image:", uploadError);
          alert(t("pets.imageUploadFailed"));
        } finally {
          setIsUploadingImage(false);
        }
      }

      navigate("/pets");
    } catch (error: any) {
      console.error("Failed to save pet:", error);
      if (error?.isAuthError) {
        await forceLogout(t("pets.sessionExpired"));
        navigate("/auth");
        return;
      }
      alert(t("pets.errorSavingPet", { error: error.message || "Unknown error occurred" }));
    }
  };

  const handleDelete = () => {
    if (window.confirm(t("pets.deleteConfirmation"))) {
      try {
        navigate("/pets");
      } catch (error) {
        console.error("Failed to delete pet:", error);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isEditing ? t("pets.editPet") : t("pets.addNewPet")}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Left column — photo + breed info */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <Card>
              <CardHeader title={t("pets.petPhoto")} />
              <Divider />
              <CardContent>
                <PetImageUpload
                  imageUrl={imagePreview}
                  onChange={handleImageUpload}
                  onRemove={() => handleImageUpload(null)}
                  disabled={isSubmitting}
                />
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t("pets.breedInfo")}
                  </Typography>
                  {watch("type") && watch("type") !== "other" && watch("breed") ? (
                    <BreedInfoCard
                      petType={watch("type")}
                      breedName={watch("breed")}
                      currentWeight={watch("weight")}
                      weightUnit={watch("weightUnit") as "kg" | "lb"}
                    />
                  ) : (
                    <Box sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>{t("pets.type")}:</strong> {watch("type") || t("pets.notSpecified")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>{t("pets.breed")}:</strong> {watch("breed") || t("pets.notSpecified")}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right column — form fields */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Card>
              <CardHeader title={t("pets.basicInformation")} />
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
                <CardHeader title={t("pets.physicalDetails")} />
                <Divider />
                <CardContent>
                  <PetDetailsForm control={control} errors={errors} isSubmitting={isSubmitting} />
                </CardContent>
              </Card>
            </Box>

            <Box mt={3}>
              <Card>
                <CardHeader title={t("pets.medicalInformation")} />
                <Divider />
                <CardContent>
                  <PetMedicalInfo control={control} errors={errors} isSubmitting={isSubmitting} />
                </CardContent>
              </Card>
            </Box>

            <Box mt={3}>
              <FormActionButtons
                isEditing={isEditing}
                isSubmitting={isSubmitting || isUploadingImage}
                onCancel={handleCancel}
                onDelete={handleDelete}
                submitButtonText={
                  isUploadingImage
                    ? t("pets.uploadingImage")
                    : isEditing
                    ? t("pets.updatePet")
                    : t("pets.addPet")
                }
              />
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default PetForm;
