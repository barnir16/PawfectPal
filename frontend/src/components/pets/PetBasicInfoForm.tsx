import { type Control, Controller, type FieldErrors } from "react-hook-form";
import {
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type { PetFormData } from "./../../features/pets/components/PetForm/PetForm.tsx";

interface PetBasicInfoFormProps {
  control: Control<PetFormData>;
  errors: FieldErrors<PetFormData>;
  petTypes: string[];
  breeds: string[];
  isSubmitting?: boolean;
}

export const PetBasicInfoForm = ({
  control,
  errors,
  petTypes,
  breeds,
  isSubmitting = false,
}: PetBasicInfoFormProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Pet Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Pet Type</InputLabel>
                <Select {...field} label="Pet Type" disabled={isSubmitting}>
                  <MenuItem value="">
                    <em>Select a type</em>
                  </MenuItem>
                  {petTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && (
                  <FormHelperText>{errors.type.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="breed"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.breed}>
                <InputLabel>Breed</InputLabel>
                <Select
                  {...field}
                  label="Breed"
                  disabled={isSubmitting || breeds.length === 0}
                >
                  <MenuItem value="">
                    <em>Select a breed</em>
                  </MenuItem>
                  {breeds.map((breed) => (
                    <MenuItem key={breed} value={breed}>
                      {breed}
                    </MenuItem>
                  ))}
                </Select>
                {errors.breed && (
                  <FormHelperText>{errors.breed.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Select {...field} label="Gender" disabled={isSubmitting}>
                  <MenuItem value="">
                    <em>Select a gender</em>
                  </MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
                {errors.gender && (
                  <FormHelperText>{errors.gender.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Birth Date"
                value={field.value}
                onChange={(date) => field.onChange(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.birthDate,
                    helperText: errors.birthDate?.message as string,
                    disabled: isSubmitting,
                  },
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default PetBasicInfoForm;
