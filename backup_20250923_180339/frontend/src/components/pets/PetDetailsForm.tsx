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
import { useLocalization } from "../../contexts/LocalizationContext";

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
  const { t } = useLocalization();
  
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
              label={t('pets.weightOptional')}
              error={!!errors.weight}
              helperText={errors.weight?.message || t('pets.enterWeightGreaterThan0')}
              disabled={isSubmitting}
              inputProps={{ 
                min: 0.1, 
                max: 200, 
                step: 0.1,
                placeholder: "0.0"
              }}
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
                          <option value="kg">{t('pets.kg')}</option>
                          <option value="lb">{t('pets.pounds')}</option>
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
              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
              label={t('pets.colorMarkings')}
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
              label={t('pets.microchipNumber')}
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
              label={t('pets.spayedNeutered')}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

export default PetDetailsForm;
