import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Stack,
} from "@mui/material";
import type { Pet } from "../types";
import { createPet, updatePet } from "../api";

interface PetFormProps {
  readonly pet?: Pet;
  readonly onPetCreated?: () => void;
  readonly onPetUpdated?: () => void;
}

export default function PetForm({
  pet,
  onPetCreated,
  onPetUpdated,
}: PetFormProps) {
  const [formData, setFormData] = useState({
    name: pet?.name || "",
    breedType: pet?.breedType || "dog",
    breed: pet?.breed || "",
    birthDate: pet?.birthDate || "",
    weightKg: pet?.weightKg?.toString() || "",
    healthIssues: pet?.healthIssues?.join(", ") || "",
    behaviorIssues: pet?.behaviorIssues?.join(", ") || "",
    isBirthdayGiven: pet?.isBirthdayGiven || false,
  });

  const [loading, setLoading] = useState(false);
  const [breedSuggestions, setBreedSuggestions] = useState<string[]>([]);

  const breedTypes = [
    { label: "Dog", value: "dog" },
    { label: "Cat", value: "cat" },
    { label: "Other", value: "other" },
  ];

  const dogBreeds = [
    "Labrador Retriever",
    "German Shepherd",
    "Golden Retriever",
    "French Bulldog",
    "Bulldog",
    "Poodle",
    "Beagle",
    "Rottweiler",
    "Dachshund",
    "Yorkshire Terrier",
    "Boxer",
    "Great Dane",
    "Siberian Husky",
    "Doberman",
    "Shih Tzu",
    "Bernese Mountain Dog",
  ];

  const catBreeds = [
    "Persian",
    "Maine Coon",
    "Siamese",
    "British Shorthair",
    "Ragdoll",
    "Abyssinian",
    "Sphynx",
    "Russian Blue",
    "Bengal",
    "American Shorthair",
    "Norwegian Forest",
    "Scottish Fold",
    "Oriental Shorthair",
    "Exotic Shorthair",
  ];

  useEffect(() => {
    if (formData.breedType === "dog") setBreedSuggestions(dogBreeds);
    else if (formData.breedType === "cat") setBreedSuggestions(catBreeds);
    else setBreedSuggestions([]);
  }, [formData.breedType]);

  const validateForm = () => {
    if (!formData.name.trim()) return (alert("Pet name is required"), false);
    if (!formData.breed.trim()) return (alert("Breed is required"), false);
    if (formData.weightKg && parseFloat(formData.weightKg) <= 0)
      return (alert("Weight must be a positive number"), false);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const petData: Omit<Pet, "id"> = {
      name: formData.name.trim(),
      breedType: formData.breedType,
      breed: formData.breed.trim(),
      birthDate: formData.birthDate || undefined,
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
      healthIssues: formData.healthIssues
        ? formData.healthIssues
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      behaviorIssues: formData.behaviorIssues
        ? formData.behaviorIssues
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      isBirthdayGiven: formData.isBirthdayGiven,
      isTrackingEnabled: false,
    };

    try {
      if (pet?.id) {
        await updatePet(pet.id, petData);
        alert("Pet updated successfully");
        onPetUpdated?.();
      } else {
        await createPet(petData);
        alert("Pet created successfully");
        onPetCreated?.();
      }
    } catch (e: any) {
      alert(e.message || "Error saving pet");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    return Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        {pet ? "Edit Pet" : "Add New Pet"}
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Pet Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <FormControl>
          <FormLabel>Pet Type</FormLabel>
          <RadioGroup
            row
            value={formData.breedType}
            onChange={(e) =>
              setFormData({ ...formData, breedType: e.target.value })
            }
          >
            {breedTypes.map(({ label, value }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                label={label}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <TextField
          label="Breed"
          required
          value={formData.breed}
          onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
        />

        {breedSuggestions.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ mb: 1 }}>
              Suggestions:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {breedSuggestions.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  onClick={() => setFormData({ ...formData, breed: b })}
                  clickable
                />
              ))}
            </Box>
          </Box>
        )}

        <TextField
          label="Birth Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.birthDate}
          onChange={(e) =>
            setFormData({ ...formData, birthDate: e.target.value })
          }
        />
        {formData.birthDate && (
          <Typography variant="caption">
            Age: {calculateAge(formData.birthDate)} years
          </Typography>
        )}

        <TextField
          label="Weight (kg)"
          type="number"
          value={formData.weightKg}
          onChange={(e) =>
            setFormData({ ...formData, weightKg: e.target.value })
          }
        />

        <TextField
          label="Health Issues"
          multiline
          minRows={2}
          value={formData.healthIssues}
          onChange={(e) =>
            setFormData({ ...formData, healthIssues: e.target.value })
          }
        />

        <TextField
          label="Behavior Issues"
          multiline
          minRows={2}
          value={formData.behaviorIssues}
          onChange={(e) =>
            setFormData({ ...formData, behaviorIssues: e.target.value })
          }
        />

        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <CircularProgress size={24} />
          ) : pet ? (
            "Update Pet"
          ) : (
            "Add Pet"
          )}
        </Button>
      </Stack>
    </Paper>
  );
}
