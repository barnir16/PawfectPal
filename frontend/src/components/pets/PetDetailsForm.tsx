import { type Control, Controller, type FieldErrors } from "react-hook-form";
import {
  TextField,
  Grid,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import {
  MonitorWeight as WeightIcon,
  ColorLens as ColorIcon,
  Memory as ChipIcon,
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
    <Grid container spacing={2.5}>
      {/* Weight + unit */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Controller
          name="weight"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              label={t("pets.weightOptional")}
              error={!!errors.weight}
              helperText={errors.weight?.message || t("pets.enterWeightGreaterThan0")}
              disabled={isSubmitting}
              inputProps={{ min: 0.1, max: 200, step: 0.1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WeightIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {/* MUI Select replaces the native <select> */}
                    <Controller
                      name="weightUnit"
                      control={control}
                      render={({ field: unitField }) => (
                        <Select
                          {...unitField}
                          variant="standard"
                          disableUnderline
                          disabled={isSubmitting}
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "text.secondary",
                            minWidth: 36,
                            "& .MuiSelect-select": { pr: "20px !important", py: 0 },
                          }}
                        >
                          <MenuItem value="kg">{t("pets.kg")}</MenuItem>
                          <MenuItem value="lb">{t("pets.pounds")}</MenuItem>
                        </Select>
                      )}
                    />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              value={field.value || ""}
            />
          )}
        />
      </Grid>

      {/* Color */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t("pets.colorMarkings")}
              error={!!errors.color}
              helperText={errors.color?.message}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ColorIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Grid>

      {/* Microchip */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Controller
          name="microchipNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t("pets.microchipNumber")}
              error={!!errors.microchipNumber}
              helperText={errors.microchipNumber?.message}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ChipIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Grid>

      {/* Spayed / Neutered */}
      <Grid size={{ xs: 12 }}>
        <Controller
          name="isNeutered"
          control={control}
          render={({ field }) => (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 2,
                py: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: field.value ? "primary.light" : "divider",
                bgcolor: field.value ? "rgba(244,162,97,0.06)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isSubmitting}
                    color="primary"
                    size="small"
                  />
                }
                label={t("pets.spayedNeutered")}
                sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: "0.9rem", fontWeight: 500 } }}
              />
            </Box>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default PetDetailsForm;
