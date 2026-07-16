import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Cancel, Save, AutoAwesome } from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { marketplaceService } from '../../services/marketplace/marketplaceService';
import { draftMarketplacePost } from '../../services/ai/marketplaceDraftService';
import type { MarketplacePostCreate } from '../../types/services/marketplacePost';
import type { Pet } from '../../types/pets/pet';

interface MarketplacePostFormProps {
  pets: Pet[];
  onSuccess?: (post: any) => void;
  onCancel?: () => void;
  initialData?: Partial<MarketplacePostCreate>;
  postId?: number;
}

const LANGUAGE_SUGGESTIONS = ['Hebrew', 'English', 'Arabic', 'Russian', 'French'];

export const MarketplacePostForm: React.FC<MarketplacePostFormProps> = ({
  pets,
  onSuccess,
  onCancel,
  initialData,
  postId,
}) => {
  const { t, currentLanguage } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<
    Array<{ id: number; name: string; description?: string }>
  >([]);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiDraftNote, setAiDraftNote] = useState<string | null>(null);

  const [formData, setFormData] = useState<MarketplacePostCreate>({
    title: '',
    description: '',
    service_type: '',
    pet_ids: [],
    location: '',
    preferred_dates: [],
    budget_min: undefined,
    budget_max: undefined,
    experience_years_min: undefined,
    languages: [],
    special_requirements: '',
    is_urgent: false,
    ...initialData,
  });

  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        const types = await marketplaceService.getServiceTypes();
        setServiceTypes(types);
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load service types');
      }
    };

    void loadServiceTypes();
  }, []);

  const selectedPets = useMemo(
    () => pets.filter((pet) => formData.pet_ids.includes(pet.id)),
    [formData.pet_ids, pets]
  );

  const validationError = useMemo(() => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.service_type) {
      return 'Please fill in all required fields';
    }

    if (formData.pet_ids.length === 0) {
      return 'Please select at least one pet';
    }

    if (
      formData.budget_min !== undefined &&
      formData.budget_max !== undefined &&
      formData.budget_min > formData.budget_max
    ) {
      return 'Minimum budget cannot be higher than maximum budget';
    }

    return null;
  }, [formData]);

  const canDraftWithAi = Boolean(formData.service_type) && selectedPets.length > 0;

  const handleDraftWithAi = async () => {
    if (!canDraftWithAi || aiDrafting) return;

    setAiDrafting(true);
    setAiDraftNote(null);
    try {
      const result = await draftMarketplacePost(
        formData.service_type,
        selectedPets.map((pet) => ({ name: pet.name, type: pet.type, breed: pet.breed })),
        {
          location: formData.location,
          isUrgent: formData.is_urgent,
          promptLanguage: currentLanguage,
        }
      );

      if (result) {
        setFormData((previous) => ({
          ...previous,
          title: result.title,
          description: result.description,
        }));
        setAiDraftNote(
          result.aiGenerated
            ? t('marketplace.aiDraftApplied') || 'AI draft applied — feel free to edit it.'
            : t('marketplace.aiDraftFallbackApplied') ||
                'AI was unavailable, so we filled in a quick starter draft instead.'
        );
      } else {
        setAiDraftNote(t('marketplace.aiDraftFailed') || 'Could not generate a draft. Please try again.');
      }
    } finally {
      setAiDrafting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedData: MarketplacePostCreate = {
        ...formData,
        preferred_dates: (formData.preferred_dates || []).filter(Boolean),
        languages: (formData.languages || []).filter(Boolean),
        special_requirements: formData.special_requirements?.trim() || undefined,
        location: formData.location?.trim() || undefined,
      };

      const post = postId
        ? await marketplaceService.updatePost(postId, normalizedData)
        : await marketplaceService.createPost(normalizedData);

      onSuccess?.(post);
    } catch (submitError: any) {
      setError(
        submitError.message ||
          (postId
            ? 'Failed to update marketplace post'
            : 'Failed to create marketplace post')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title={postId ? t('marketplace.editPost') : t('marketplace.createPost')}
        subheader={
          postId
            ? t('marketplace.createPostSubtitle')
            : t('marketplace.createPostSubtitle')
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('marketplace.basicInfo')}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('marketplace.title')}
                value={formData.title}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, title: event.target.value }))
                }
                required
                placeholder={t('marketplace.titlePlaceholder')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('marketplace.description')}
                value={formData.description}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                required
                placeholder={t('marketplace.descriptionPlaceholder')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('marketplace.serviceType')}</InputLabel>
                <Select
                  value={formData.service_type}
                  label={t('marketplace.serviceType')}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      service_type: event.target.value,
                    }))
                  }
                >
                  {serviceTypes.map((type) => (
                    <MenuItem key={type.id} value={type.name}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('marketplace.location')}
                value={formData.location || ''}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, location: event.target.value }))
                }
                placeholder={t('marketplace.locationPlaceholder')}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={pets}
                getOptionLabel={(pet) => `${pet.name} (${pet.type || t('pets.pet')})`}
                value={selectedPets}
                onChange={(_, nextPets) =>
                  setFormData((previous) => ({
                    ...previous,
                    pet_ids: nextPets.map((pet) => pet.id),
                  }))
                }
                renderInput={(params) => (
                  <TextField {...params} label={t('marketplace.selectPets')} required />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={aiDrafting ? <CircularProgress size={16} /> : <AutoAwesome />}
                  onClick={handleDraftWithAi}
                  disabled={!canDraftWithAi || aiDrafting}
                >
                  {t('marketplace.draftWithAi') || 'Draft with AI'}
                </Button>
                {!canDraftWithAi && (
                  <Typography variant="caption" color="text.secondary">
                    {t('marketplace.draftWithAiHint') || 'Pick a service type and at least one pet first'}
                  </Typography>
                )}
              </Box>
              {aiDraftNote && (
                <Alert severity="info" sx={{ mt: 1.5 }} onClose={() => setAiDraftNote(null)}>
                  {aiDraftNote}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                {t('marketplace.budget')}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label={t('marketplace.minBudget')}
                value={formData.budget_min ?? ''}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    budget_min: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label={t('marketplace.maxBudget')}
                value={formData.budget_max ?? ''}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    budget_max: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label={t('marketplace.minExperience')}
                value={formData.experience_years_min ?? ''}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    experience_years_min: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={LANGUAGE_SUGGESTIONS}
                value={formData.languages || []}
                onChange={(_, nextLanguages) =>
                  setFormData((previous) => ({
                    ...previous,
                    languages: nextLanguages.map((language) => language.trim()).filter(Boolean),
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('marketplace.languages')}
                    placeholder={t('marketplace.languagePlaceholder')}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.preferred_dates || []}
                onChange={(_, nextDates) =>
                  setFormData((previous) => ({
                    ...previous,
                    preferred_dates: nextDates.map((date) => date.trim()).filter(Boolean),
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('marketplace.preferredDates')}
                    placeholder={t('marketplace.datePlaceholder')}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('marketplace.specialRequirements')}
                value={formData.special_requirements || ''}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    special_requirements: event.target.value,
                  }))
                }
                placeholder={t('marketplace.specialRequirementsPlaceholder')}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_urgent}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        is_urgent: event.target.checked,
                      }))
                    }
                  />
                }
                label={t('marketplace.urgent')}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              startIcon={<Cancel />}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : <Save />}
            >
              {loading
                ? t('common.saving')
                : postId
                  ? t('common.save')
                  : t('marketplace.createPost')}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
