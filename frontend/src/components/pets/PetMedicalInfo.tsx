import { type FieldErrors, Controller, type Control } from "react-hook-form";
import { TextField, Grid } from "@mui/material";
import { 
  Notes as NotesIcon,
  MedicalServices as HealthIcon,
  Psychology as BehaviorIcon
} from "@mui/icons-material";
import type { PetFormData } from "./../../features/pets/components/PetForm/PetForm.tsx";
import { IssuesList } from "./IssuesList";

interface PetMedicalInfoProps {
  control: Control<PetFormData>;
  errors: FieldErrors<PetFormData>;
  isSubmitting?: boolean;
}

export const PetMedicalInfo = ({
  control,
  errors,
  isSubmitting = false,
}: PetMedicalInfoProps) => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="healthIssues"
          control={control}
          render={({ field }) => (
            <IssuesList
              label="Health Issues"
              placeholder="Enter a health issue (e.g., blind, allergic to cats)"
              value={field.value || []}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={!!errors.healthIssues}
              helperText={errors.healthIssues?.message || "Add health conditions, allergies, or medical concerns one by one"}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="behaviorIssues"
          control={control}
          render={({ field }) => (
            <IssuesList
              label="Behavior Issues"
              placeholder="Enter a behavior issue (e.g., aggressive, anxious)"
              value={field.value || []}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={!!errors.behaviorIssues}
              helperText={errors.behaviorIssues?.message || "Add behavioral concerns or training needs one by one"}
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
              fullWidth
              multiline
              rows={4}
              label="Additional Notes"
              placeholder="Any other important information about your pet"
              error={!!errors.notes}
              helperText={errors.notes?.message || "Include any other relevant information about your pet's care, preferences, or special needs"}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <NotesIcon
                    color="action"
                    sx={{
                      position: "absolute",
                      left: 14,
                      top: 14,
                    }}
                  />
                ),
                sx: {
                  pl: 6,
                  pt: 2,
                  "& textarea": {
                    pl: 2,
                  },
                },
              }}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default PetMedicalInfo;
