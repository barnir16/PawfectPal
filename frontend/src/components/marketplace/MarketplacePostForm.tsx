import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
} from '@mui/material';
import { Add, Remove, Save, Cancel } from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { marketplaceService } from '../../services/marketplace/marketplaceService';
import type { MarketplacePostCreate } from '../../types/services/marketplacePost';
import type { Pet } from '../../types/pets/pet';

interface MarketplacePostFormProps {
  pets: Pet[];
  onSuccess?: (post: any) => void;
  onCancel?: () => void;
  initialData?: Partial<MarketplacePostCreate>;
}

export const MarketplacePostForm: React.FC<MarketplacePostFormProps> = ({
  pets,
  onSuccess,
  onCancel,
  initialData,
}) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<Array<{ id: number; name: string; description?: string }>>([]);

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

  const [newDate, setNewDate] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    try {
      const types = await marketplaceService.getServiceTypes();
      setServiceTypes(types);
    } catch (error) {
      console.error('Failed to load service types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.service_type) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.pet_ids.length === 0) {
      setError('Please select at least one pet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const post = await marketplaceService.createPost(formData);
      onSuccess?.(post);
    } catch (error: any) {
      setError(error.message || 'Failed to create marketplace post');
    } finally {
      setLoading(false);
    }
  };

  const addDate = () => {
    if (newDate.trim()) {
      setFormData(prev => ({
        ...prev,
        preferred_dates: [...(prev.preferred_dates || []), newDate.trim()]
      }));
      setNewDate('');
    }
  };

  const removeDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preferred_dates: prev.preferred_dates?.filter((_, i) => i !== index) || []
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setFormData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <Card>
      <CardHeader 
        title={t('marketplace.createPost') || 'Create Marketplace Post'}
        subheader={t('marketplace.createPostSubtitle') || 'Share your service needs with all providers'}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                {t('marketplace.basicInfo') || 'Basic Information'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('marketplace.title') || 'Post Title'}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder={t('marketplace.titlePlaceholder') || 'e.g., Need dog walking for vacation'}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('marketplace.description') || 'Description'}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                placeholder={t('marketplace.descriptionPlaceholder') || 'Describe your needs in detail...'}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>{t('marketplace.serviceType') || 'Service Type'}</InputLabel>
                <Select
                  value={formData.service_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                >
                  {serviceTypes.map((type) => (
                    <MenuItem key={type.id} value={type.name}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('marketplace.location') || 'Location'}
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('marketplace.locationPlaceholder') || 'City, Neighborhood'}
              />
            </Grid>

            {/* Pet Selection */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('marketplace.pets') || 'Pets'}
              </Typography>
              <FormControl fullWidth required>
                <InputLabel>{t('marketplace.selectPets') || 'Select Pets'}</InputLabel>
                <Select
                  multiple
                  value={formData.pet_ids}
                  onChange={(e) => setFormData(prev => ({ ...prev, pet_ids: e.target.value as number[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((petId) => {
                        const pet = pets.find(p => p.id === petId);
                        return (
                          <Chip key={petId} label={pet?.name || `Pet ${petId}`} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {pets.map((pet) => (
                    <MenuItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Budget */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('marketplace.budget') || 'Budget'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label={t('marketplace.minBudget') || 'Minimum Budget'}
                value={formData.budget_min || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  budget_min: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="0"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label={t('marketplace.maxBudget') || 'Maximum Budget'}
                value={formData.budget_max || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  budget_max: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="1000"
              />
            </Grid>

            {/* Preferred Dates */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('marketplace.preferredDates') || 'Preferred Dates'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder={t('marketplace.datePlaceholder') || 'YYYY-MM-DD'}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <Button size="small" onClick={addDate} startIcon={<Add />}>
                  {t('common.add') || 'Add'}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.preferred_dates?.map((date, index) => (
                  <Chip
                    key={index}
                    label={date}
                    onDelete={() => removeDate(index)}
                    deleteIcon={<Remove />}
                  />
                ))}
              </Box>
            </Grid>

            {/* Requirements */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('marketplace.requirements') || 'Requirements'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label={t('marketplace.minExperience') || 'Minimum Experience (years)'}
                value={formData.experience_years_min || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  experience_years_min: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="0"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_urgent}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_urgent: e.target.checked }))}
                  />
                }
                label={t('marketplace.urgent') || 'Urgent'}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('marketplace.specialRequirements') || 'Special Requirements'}
                value={formData.special_requirements || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                placeholder={t('marketplace.specialRequirementsPlaceholder') || 'Any special requirements or notes...'}
              />
            </Grid>

            {/* Languages */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('marketplace.languages') || 'Required Languages'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder={t('marketplace.languagePlaceholder') || 'English, Hebrew, etc.'}
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                />
                <Button size="small" onClick={addLanguage} startIcon={<Add />}>
                  {t('common.add') || 'Add'}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.languages?.map((language, index) => (
                  <Chip
                    key={index}
                    label={language}
                    onDelete={() => removeLanguage(index)}
                    deleteIcon={<Remove />}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              startIcon={<Cancel />}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            >
              {loading ? (t('common.creating') || 'Creating...') : (t('marketplace.createPost') || 'Create Post')}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
