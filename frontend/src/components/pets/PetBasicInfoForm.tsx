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

interface PetBasicInfoFormProps {
  control: Control<PetFormData>;
  errors: FieldErrors<PetFormData>;
  petTypes: string[];
  breeds: string[];
  isSubmitting?: boolean;
  loadingBreeds?: boolean;
  breedError?: string | null;
}

export const PetBasicInfoForm = ({
  control,
  errors,
  petTypes,
  breeds,
  isSubmitting = false,
  loadingBreeds = false,
  breedError = null,
}: PetBasicInfoFormProps) => {
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
              
              // For "other" pet type, show regular text input
              if (petType === "other") {
                return (
                  <TextField
                    {...field}
                    fullWidth
                    label="Custom Pet Type & Breed"
                    placeholder="Enter your pet's type and breed (e.g., Guinea Pig, Cockatiel)"
                    error={!!errors.breed}
                    helperText={errors.breed?.message || "Enter the specific type and breed of your pet"}
                    disabled={isSubmitting}
                  />
                );
              }
              
              // For supported pet types (dog/cat), show autocomplete with custom entry
              return (
                <Autocomplete
                  value={field.value || ""}
                  onChange={(_, newValue) => field.onChange(newValue || "")}
                  options={breeds}
                  loading={loadingBreeds}
                  disabled={isSubmitting || !petType}
                  freeSolo
                  filterOptions={(options, params) => {
                    const filtered = options.filter(option =>
                      option.toLowerCase().includes(params.inputValue.toLowerCase())
                    );
                    return filtered;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Breed"
                      error={!!errors.breed}
                      helperText={
                        errors.breed?.message || 
                        breedError ||
                        (!petType 
                          ? "Select pet type first" 
                          : loadingBreeds 
                          ? "Loading breeds..." 
                          : "Type to search breeds or enter a custom breed"
                        )
                      }
                      placeholder={!petType ? "Select pet type first" : "Type to search breeds..."}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option}>
                      {option}
                    </li>
                  )}
                  noOptionsText={
                    !petType 
                      ? "Select pet type first"
                      : loadingBreeds 
                      ? "Loading breeds..."
                      : "No breeds found - you can enter a custom breed"
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
            name="ageType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.ageType}>
                <InputLabel>Age Information</InputLabel>
                <Select {...field} label="Age Information" disabled={isSubmitting}>
                  <MenuItem value="birthday">Exact Birthday</MenuItem>
                  <MenuItem value="age">Approximate Age</MenuItem>
                </Select>
                {errors.ageType && (
                  <FormHelperText>{errors.ageType.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* Conditionally render birth date field only when ageType is 'birthday' */}
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
                    // Try different methods to open the date picker
                    if (input.showPicker) {
                      input.showPicker();
                    } else {
                      // Fallback: focus and click the input
                      input.focus();
                      input.click();
                    }
                  }
                };
                
                return (
                  <TextField
                    {...field}
                    fullWidth
                    label="Birth Date"
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
                          <IconButton
                            onClick={handleCalendarClick}
                            edge="end"
                            size="small"
                            aria-label="Open calendar"
                          >
                            <CalendarIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& input[type="date"]::-webkit-calendar-picker-indicator': {
                        cursor: 'pointer',
                        opacity: 1,
                        width: '20px',
                        height: '20px',
                      },
                      '& input[type="date"]': {
                        cursor: 'pointer',
                      },
                    }}
                  />
                );
              }}
            />
          </Grid>
        )}

        {/* Conditionally render age field only when ageType is 'age' */}
        {useWatch({ control, name: "ageType" }) === "age" && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="age"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Age (years)"
                  type="number"
                  error={!!errors.age}
                  helperText={errors.age?.message}
                  disabled={isSubmitting}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  inputProps={{ min: 0, max: 30, step: 0.1 }}
                />
              )}
            />
          </Grid>
        )}
      </Grid>
  );
};

export default PetBasicInfoForm;
