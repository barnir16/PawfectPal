import { type Control, Controller, type FieldErrors } from "react-hook-form";
import {
  TextField,
  Grid,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  MonitorWeight as WeightIcon,
  ColorLens as ColorIcon,
} from "@mui/icons-material";
import type { PetFormData } from "./../../features/pets/components/PetForm/PetForm.tsx";

interface PetDetailsFormProps {
  control: Control<PetFormData>;
  errors: FieldErrors<PetFormData>;
  isSubmitting?: boolean;
}

export const PetDetailsForm = ({
  control,
  errors,
  isSubmitting = false,
}: PetDetailsFormProps) => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Controller
          name="weight"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              label="Weight"
              error={!!errors.weight}
              helperText={errors.weight?.message}
              disabled={isSubmitting}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Controller
                      name="weightUnit"
                      control={control}
                      render={({ field: unitField }) => (
                        <select
                          {...unitField}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "inherit",
                            font: "inherit",
                            cursor: "pointer",
                            outline: "inherit",
                          }}
                          disabled={isSubmitting}
                        >
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                        </select>
                      )}
                    />
                  </InputAdornment>
                ),
                startAdornment: (
                  <InputAdornment position="start">
                    <WeightIcon color="action" />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || "")}
              value={field.value || ""}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Color/Markings"
              error={!!errors.color}
              helperText={errors.color?.message}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ColorIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Controller
          name="microchipNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Microchip Number"
              error={!!errors.microchipNumber}
              helperText={errors.microchipNumber?.message}
              disabled={isSubmitting}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Controller
          name="isNeutered"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isSubmitting}
                />
              }
              label="Spayed/Neutered"
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default PetDetailsForm;
