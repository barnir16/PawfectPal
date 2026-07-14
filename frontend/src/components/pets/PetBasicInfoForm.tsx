import React from "react";
import { type Control, Controller, type FieldErrors, useWatch } from "react-hook-form";
import {
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Autocomplete,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { CalendarToday as CalendarIcon } from "@mui/icons-material";

import type { PetFormData } from "./../../features/pets/components/PetForm/PetForm.tsx";
import { useLocalization } from "../../contexts/LocalizationContext";

interface PetBasicInfoFormProps {
  control: Control<PetFormData>;
  errors: FieldErrors<PetFormData>;
  petTypes: string[];
  breeds: string[];
  isSubmitting?: boolean;
  loadingBreeds?: boolean;
  breedError?: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const PetBasicInfoForm = ({
  control,
  errors,
  petTypes,
  breeds,
  isSubmitting = false,
  loadingBreeds = false,
  breedError = null,
}: PetBasicInfoFormProps) => {
  const { t } = useLocalization();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('pets.petName')}
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
              <InputLabel>{t('pets.type')}</InputLabel>
              <Select {...field} label={t('pets.type')} disabled={isSubmitting}>
                <MenuItem value="">
                  <em>{t('pets.selectType')}</em>
                </MenuItem>
                {petTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type === "other" ? "Other (Custom)" : type.charAt(0).toUpperCase() + type.slice(1)}
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
          render={({ field }) => {
            const petType = useWatch({ control, name: "type" });

            if (petType === "other") {
              return (
                <TextField
                  {...field}
                  fullWidth
                  label={t('pets.breed')}
                  placeholder={t('pets.enterCustomBreed')}
                  error={!!errors.breed}
                  helperText={errors.breed?.message || t('pets.enterCustomBreed')}
                  disabled={isSubmitting}
                />
              );
            }

            return (
              <Autocomplete
                value={field.value || ""}
                onChange={(_, newValue) => field.onChange(newValue || "")}
                onInputChange={(_, newInputValue) => {
                  field.onChange(newInputValue);
                }}
                options={breeds}
                loading={loadingBreeds}
                disabled={isSubmitting || !petType}
                freeSolo
                autoComplete
                filterOptions={(options) => options}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('pets.breed')}
                    error={!!errors.breed}
                    helperText={
                      errors.breed?.message ||
                      breedError ||
                      (!petType
                        ? t('pets.selectPetTypeFirst')
                        : field.value && field.value.length < 3
                        ? t('pets.typeAtLeast3Chars')
                        : loadingBreeds
                        ? t('pets.searchingBreeds')
                        : t('pets.typeToSearchBreeds')
                      )
                    }
                    placeholder={
                      !petType
                        ? t('pets.selectPetTypeFirst')
                        : field.value && field.value.length < 3
                        ? t('pets.typeAtLeast3Chars')
                        : t('pets.typeToSearchBreeds')
                    }
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option}>{option}</li>
                )}
                noOptionsText={
                  !petType
                    ? t('pets.selectPetTypeFirst')
                    : field.value && field.value.length < 3
                    ? t('pets.typeAtLeast3Chars')
                    : loadingBreeds
                    ? t('pets.searchingBreeds')
                    : t('pets.noBreedsFound')
                }
              />
            );
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>{t('pets.gender')}</InputLabel>
              <Select {...field} label={t('pets.gender')} disabled={isSubmitting}>
                <MenuItem value="">
                  <em>{t('pets.selectGender')}</em>
                </MenuItem>
                <MenuItem value="male">{t('pets.male')}</MenuItem>
                <MenuItem value="female">{t('pets.female')}</MenuItem>
                <MenuItem value="unknown">{t('pets.unknown')}</MenuItem>
              </Select>
              {errors.gender && (
                <FormHelperText>{errors.gender.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {/* Age mode selector */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="ageType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.ageType}>
              <InputLabel>{t('pets.ageInformation')}</InputLabel>
              <Select {...field} label={t('pets.ageInformation')} disabled={isSubmitting}>
                <MenuItem value="birthday">{t('pets.exactBirthday')}</MenuItem>
                <MenuItem value="age">{t('pets.approximateAge')}</MenuItem>
              </Select>
              {errors.ageType && (
                <FormHelperText>{errors.ageType.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {/* Exact birthday */}
      {useWatch({ control, name: "ageType" }) === "birthday" && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => {
              const inputRef = React.useRef<HTMLInputElement>(null);
              const handleCalendarClick = () => {
                const input = inputRef.current;
                if (input) {
                  if (input.showPicker) {
                    input.showPicker();
                  } else {
                    input.focus();
                    input.click();
                  }
                }
              };
              return (
                <TextField
                  {...field}
                  fullWidth
                  label={t('pets.birthDate')}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.birthDate}
                  helperText={errors.birthDate?.message}
                  disabled={isSubmitting}
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  inputRef={inputRef}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleCalendarClick} edge="end" size="small" aria-label="Open calendar">
                          <CalendarIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& input[type="date"]::-webkit-calendar-picker-indicator': { cursor: 'pointer', opacity: 1, width: '20px', height: '20px' },
                    '& input[type="date"]': { cursor: 'pointer' },
                  }}
                />
              );
            }}
          />
        </Grid>
      )}

      {/* Approximate age — year is derived from age input so it always stays current */}
      {useWatch({ control, name: "ageType" }) === "age" && (
        <>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="age"
              control={control}
              render={({ field }) => {
                const ageVal = field.value;
                const derivedYear = ageVal !== undefined && ageVal >= 0
                  ? new Date().getFullYear() - Math.floor(ageVal)
                  : null;
                return (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('pets.age')}
                    type="number"
                    error={!!errors.age}
                    helperText={
                      errors.age?.message ||
                      (derivedYear !== null
                        ? `Born approx. ${derivedYear}`
                        : t('pets.enterAgeBetween0And30'))
                    }
                    disabled={isSubmitting}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value !== '' ? parseInt(e.target.value, 10) : undefined)}
                    inputProps={{ min: 0, max: 30, step: 1 }}
                  />
                );
              }}
            />
          </Grid>

          {/* Optional birth month — makes age tracking more accurate */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <Controller
              name="approxMonth"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel shrink>{t('pets.birthMonth')}</InputLabel>
                  <Select
                    {...field}
                    label={t('pets.birthMonth')}
                    displayEmpty
                    notched
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    disabled={isSubmitting}
                  >
                    <MenuItem value=""><em>{t('pets.unknownMonth')}</em></MenuItem>
                    {MONTHS.map((month, idx) => (
                      <MenuItem key={idx + 1} value={idx + 1}>{month}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{t('pets.birthMonthHelp')}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default PetBasicInfoForm;
