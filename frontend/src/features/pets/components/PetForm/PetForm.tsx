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
  alpha,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Pets as PetsIcon,
  FitnessCenter as PhysicalIcon,
  HealthAndSafety as MedicalIcon,
  PhotoCamera as PhotoIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

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
    { message: "Please provide either a birth date or age", path: ["ageType"] }
  );

export type PetFormData = z.infer<typeof schema>;

// Shared warm card header style — amber tint background, subtle amber border
const sectionCardSx = {
  overflow: "hidden",
  border: "1px solid",
  borderColor: "rgba(244, 162, 97, 0.18)",
  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
};

const sectionHeaderSx = {
  bgcolor: "rgba(244, 162, 97, 0.07)",
  borderBottom: "1px solid",
  borderColor: "rgba(244, 162, 97, 0.18)",
  py: 1.5,
  px: 3,
};

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={600} letterSpacing={0.1}>
        {title}
      </Typography>
    </Box>
  );
}

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

  // Fetch breed suggestions whenever type or breed text changes
  useEffect(() => {
    if (!selectedPetType || selectedPetType === "other") {
      setBreeds([]);
      return;
    }
    const search = async () => {
      setLoadingBreeds(true);
      setBreedError(null);
      try {
        let fetched: string[] = [];
        if (selectedPetType === "dog") fetched = await fetchDogBreeds(selectedBreed || "");
        else if (selectedPetType === "cat") fetched = await fetchCatBreeds(selectedBreed || "");
        setBreeds(fetched.length > 0 ? fetched : ["Other"]);
      } catch {
        setBreedError("Could not load breeds. You can still type a breed name.");
        setBreeds(["Other"]);
      } finally {
        setLoadingBreeds(false);
      }
    };
    const t = setTimeout(search, 150);
    return () => clearTimeout(t);
  }, [selectedPetType, selectedBreed]);

  // Load pet for editing
  useEffect(() => {
    if (!isEditing || !id) return;
    const fetch = async () => {
      try {
        const data = await getPet(parseInt(id));
        setPetData(data);

        let loadedAge = data.age;
        let loadedApproxMonth: number | undefined;
        if (!data.isBirthdayGiven && data.birthDate) {
          const bd = new Date(data.birthDate);
          loadedAge = new Date().getFullYear() - bd.getFullYear();
          const m = bd.getMonth() + 1;
          loadedApproxMonth = m !== 7 ? m : undefined;
        }

        reset({
          name: data.name,
          type: data.type,
          breed: data.breed,
          gender: data.gender,
          ageType: data.isBirthdayGiven ? "birthday" : ("age" as const),
          birthDate: data.isBirthdayGiven && data.birthDate ? new Date(data.birthDate) : new Date(),
          age: loadedAge,
          approxMonth: loadedApproxMonth,
          weight: data.weightKg,
          weightUnit: data.weightUnit,
          color: data.color,
          microchipNumber: data.microchipNumber,
          isNeutered: data.isNeutered,
          notes: data.notes,
          healthIssues: data.healthIssues || [],
          behaviorIssues: data.behaviorIssues || [],
          image: data.imageUrl,
        });
        setImagePreview(data.imageUrl || null);
      } catch {
        alert(t("pets.failedToLoad"));
      }
    };
    fetch();
  }, [id, isEditing, reset]);

  const handleImageUpload = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: PetFormData) => {
    try {
      let birthDateStr: string | undefined;
      if (data.ageType === "birthday") {
        birthDateStr = data.birthDate ? data.birthDate.toISOString().split("T")[0] : undefined;
      } else if (data.age !== undefined) {
        const yr = new Date().getFullYear() - Math.floor(data.age);
        const mo = data.approxMonth ? data.approxMonth - 1 : 6;
        birthDateStr = `${yr}-${String(mo + 1).padStart(2, "0")}-01`;
      }

      const payload: Omit<Pet, "id"> = {
        name: data.name,
        type: data.type as PetType,
        breed: data.breed,
        gender: data.gender as PetGender,
        age: undefined,
        birthDate: birthDateStr,
        weightKg: data.weight || undefined,
        weightUnit: data.weightUnit as "kg" | "lb",
        color: data.color,
        microchipNumber: data.microchipNumber,
        isNeutered: data.isNeutered,
        notes: data.notes,
        imageUrl: imagePreview || petData?.imageUrl || "",
        healthIssues: Array.isArray(data.healthIssues) ? data.healthIssues : data.healthIssues ? [data.healthIssues] : [],
        behaviorIssues: Array.isArray(data.behaviorIssues) ? data.behaviorIssues : data.behaviorIssues ? [data.behaviorIssues] : [],
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
        const updated = await updatePet(parseInt(id), payload);
        petId = updated.id;
        alert(t("pets.petUpdated"));
      } else {
        const created = await createPet(payload);
        petId = created.id;
        alert(t("pets.petCreated"));
      }

      if (imageFile) {
        try {
          setIsUploadingImage(true);
          await uploadPetImage(petId, imageFile);
        } catch {
          alert(t("pets.imageUploadFailed"));
        } finally {
          setIsUploadingImage(false);
        }
      }

      navigate("/pets");
    } catch (error: any) {
      if (error?.isAuthError) {
        await forceLogout(t("pets.sessionExpired"));
        navigate("/auth");
        return;
      }
      alert(t("pets.errorSavingPet", { error: error.message || "Unknown error" }));
    }
  };

  const handleDelete = () => {
    if (window.confirm(t("pets.deleteConfirmation"))) navigate("/pets");
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            bgcolor: "rgba(244,162,97,0.1)",
            "&:hover": { bgcolor: "rgba(244,162,97,0.2)" },
          }}
        >
          <ArrowBackIcon sx={{ color: "primary.main" }} />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {isEditing ? t("pets.editPet") : t("pets.addNewPet")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing ? t("pets.updateYourPetsDetails") : t("pets.fillInYourNewPet")}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Left column — photo + breed info */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <Card sx={sectionCardSx}>
              <CardHeader
                title={<SectionHeader icon={<PhotoIcon fontSize="small" />} title={t("pets.petPhoto")} />}
                sx={sectionHeaderSx}
              />
              <CardContent sx={{ p: 3 }}>
                <PetImageUpload
                  imageUrl={imagePreview}
                  onChange={handleImageUpload}
                  onRemove={() => handleImageUpload(null)}
                  disabled={isSubmitting}
                />
              </CardContent>

              {/* Breed info lives below the photo on the left panel */}
              {watch("type") && watch("type") !== "other" && watch("breed") && (
                <>
                  <Divider sx={{ borderColor: "rgba(244,162,97,0.15)" }} />
                  <CardHeader
                    title={<SectionHeader icon={<InfoIcon fontSize="small" />} title={t("pets.breedInfo")} />}
                    sx={sectionHeaderSx}
                  />
                  <CardContent sx={{ p: 2 }}>
                    <BreedInfoCard
                      petType={watch("type")}
                      breedName={watch("breed")}
                      currentWeight={watch("weight")}
                      weightUnit={watch("weightUnit") as "kg" | "lb"}
                    />
                  </CardContent>
                </>
              )}
            </Card>
          </Grid>

          {/* Right column — sections */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            {/* Basic Information */}
            <Card sx={sectionCardSx}>
              <CardHeader
                title={<SectionHeader icon={<PetsIcon fontSize="small" />} title={t("pets.basicInformation")} />}
                sx={sectionHeaderSx}
              />
              <CardContent sx={{ p: 3 }}>
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

            {/* Physical Details */}
            <Card sx={{ ...sectionCardSx, mt: 2.5 }}>
              <CardHeader
                title={<SectionHeader icon={<PhysicalIcon fontSize="small" />} title={t("pets.physicalDetails")} />}
                sx={sectionHeaderSx}
              />
              <CardContent sx={{ p: 3 }}>
                <PetDetailsForm control={control} errors={errors} isSubmitting={isSubmitting} />
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card sx={{ ...sectionCardSx, mt: 2.5 }}>
              <CardHeader
                title={<SectionHeader icon={<MedicalIcon fontSize="small" />} title={t("pets.medicalInformation")} />}
                sx={sectionHeaderSx}
              />
              <CardContent sx={{ p: 3 }}>
                <PetMedicalInfo control={control} errors={errors} isSubmitting={isSubmitting} />
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Box mt={2.5}>
              <FormActionButtons
                isEditing={isEditing}
                isSubmitting={isSubmitting || isUploadingImage}
                onCancel={() => navigate(-1)}
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
