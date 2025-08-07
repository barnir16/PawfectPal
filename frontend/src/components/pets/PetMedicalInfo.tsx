import { type FieldErrors, Controller } from "react-hook-form";
import { TextField, Grid } from "@mui/material";
import { Notes as NotesIcon } from "@mui/icons-material";
import type { PetFormData } from "./../../features/pets/components/PetForm/PetForm.tsx";

interface PetMedicalInfoProps {
  control: any; // Using any to avoid type issues with Controller
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
      <Grid size={{ xs: 12 }}>
        <TextField
          name="notes"
          label="Medical Notes"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          error={!!errors.notes}
          helperText={errors.notes?.message}
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
          // @ts-ignore - TypeScript has issues with Controller and TextField
          as={({ field }: { field: any }) => (
            <Controller
              name="notes"
              control={control}
              render={({ field: controllerField }) => (
                <TextField
                  {...controllerField}
                  fullWidth
                  multiline
                  rows={4}
                  label="Medical Notes"
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
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
          )}
        />
      </Grid>

      {/* Add more medical-related fields here as needed */}
      {/* For example: */}
      {/* <Grid item xs={12} sm={6}>
        <Controller
          name="allergies"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Allergies"
              error={!!errors.allergies}
              helperText={errors.allergies?.message}
              disabled={isSubmitting}
            />
          )}
        />
      </Grid> */}
    </Grid>
  );
};

export default PetMedicalInfo;
