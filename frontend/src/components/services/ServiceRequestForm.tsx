import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { getPets } from '../../services/pets/petService';
import { ServiceRequestService } from '../../services/serviceRequests/serviceRequestService';
import type { Pet } from '../../types/pets';
import type { ServiceRequestCreate } from '../../types/services/serviceRequest';

const serviceRequestSchema = z.object({
  service_type: z.string().min(1, 'Service type is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  pet_ids: z.array(z.number()).min(1, 'Select at least one pet'),
  location: z.string().optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  experience_years_min: z.number().min(0).max(50).optional(),
  languages: z.array(z.string()).optional(),
  special_requirements: z.string().optional(),
  is_urgent: z.boolean().default(false)
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
  onSuccess?: (requestId: number) => void;
  onCancel?: () => void;
}

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { t } = useLocalization();
  const { isAuthenticated } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      service_type: '',
      title: '',
      description: '',
      pet_ids: [],
      location: '',
      budget_min: undefined,
      budget_max: undefined,
      experience_years_min: undefined,
      languages: [],
      special_requirements: '',
      is_urgent: false
    }
  });

  const selectedPetIds = watch('pet_ids');
  const selectedLanguages = watch('languages') || [];

  // Load user's pets
  useEffect(() => {
    const loadPets = async () => {
      if (!isAuthenticated) return;
      
      try {
        const petsData = await getPets();
        setPets(petsData);
      } catch (error) {
        console.error('Failed to load pets:', error);
      }
    };

    loadPets();
  }, [isAuthenticated]);

  const onSubmit = async (data: ServiceRequestFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const request = await ServiceRequestService.createServiceRequest(data);
      
      if (onSuccess) {
        onSuccess(request.id);
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create service request');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePetToggle = (petId: number) => {
    const currentIds = selectedPetIds || [];
    const newIds = currentIds.includes(petId)
      ? currentIds.filter(id => id !== petId)
      : [...currentIds, petId];
    
    setValue('pet_ids', newIds);
  };

  const handleLanguageToggle = (language: string) => {
    const currentLanguages = selectedLanguages;
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(lang => lang !== language)
      : [...currentLanguages, language];
    
    setValue('languages', newLanguages);
  };

  if (!isAuthenticated) {
    return (
      <Alert severity="warning">
        Please log in to create a service request
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('services.createRequest')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Service Type */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="service_type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.service_type}>
                <InputLabel>{t('services.serviceType')}</InputLabel>
                <Select {...field}>
                  <MenuItem value="walking">{t('services.walking')}</MenuItem>
                  <MenuItem value="sitting">{t('services.sitting')}</MenuItem>
                  <MenuItem value="boarding">{t('services.boarding')}</MenuItem>
                  <MenuItem value="grooming">{t('services.grooming')}</MenuItem>
                  <MenuItem value="veterinary">{t('services.veterinary')}</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {/* Title */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('services.requestTitle')}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={4}
                label={t('services.requestDescription')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />
        </Grid>

        {/* Pet Selection */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom>
            {t('services.selectPets')}
          </Typography>
          <Grid container spacing={2}>
            {pets.map((pet) => (
              <Grid key={pet.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedPetIds?.includes(pet.id) ? 2 : 1,
                    borderColor: selectedPetIds?.includes(pet.id) ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handlePetToggle(pet.id)}
                >
                  <CardContent>
                    <Typography variant="h6">{pet.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pet.type} • {pet.breed}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {errors.pet_ids && (
            <Typography color="error" variant="caption">
              {errors.pet_ids.message}
            </Typography>
          )}
        </Grid>

        {/* Location */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('services.location')}
                placeholder={t('services.locationPlaceholder')}
              />
            )}
          />
        </Grid>

        {/* Budget */}
        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="budget_min"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('services.budgetMin')}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Controller
            name="budget_max"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('services.budgetMax')}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            )}
          />
        </Grid>

        {/* Experience */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="experience_years_min"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('services.experienceYears')}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            )}
          />
        </Grid>

        {/* Languages */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom>
            {t('services.requiredLanguages')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['עברית', 'English', 'Русский', 'العربية'].map((language) => (
              <Chip
                key={language}
                label={language}
                onClick={() => handleLanguageToggle(language)}
                color={selectedLanguages.includes(language) ? 'primary' : 'default'}
                variant={selectedLanguages.includes(language) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Grid>

        {/* Special Requirements */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="special_requirements"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label={t('services.specialRequirements')}
                placeholder={t('services.specialRequirementsPlaceholder')}
              />
            )}
          />
        </Grid>

        {/* Urgent */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="is_urgent"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                  />
                }
                label={t('services.isUrgent')}
              />
            )}
          />
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {onCancel && (
              <Button onClick={onCancel} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || isLoading}
              startIcon={isSubmitting || isLoading ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting || isLoading ? t('common.creating') : t('services.createRequest')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};