import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import {
  Person,
  Work,
  School,
  CheckCircle,
} from '@mui/icons-material';

import { useLocalization } from '../../../contexts/LocalizationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getBaseUrl, getToken } from '../../../services/api';
import { getServiceTypeLabel } from '../../../utils/serviceTypeLabel';

interface ServiceType {
  id: number;
  name: string;
  description?: string;
}

const steps = [
  'Basic Information',
  'Services & Pricing',
  'Experience & Languages',
  'Review & Complete',
];

export const ProviderProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { user, checkAuth } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [formData, setFormData] = useState({
    bio: '',
    hourly_rate: '',
    service_radius: '',
    experience_years: '',
    languages: [] as string[],
    services: [] as string[],
  });

  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/provider-profiles/types/`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setServiceTypes(data);
      } catch (loadError) {
        console.error('Failed to load service types:', loadError);
        setServiceTypes([
          { id: 1, name: 'Dog Walking', description: 'Professional dog walking services' },
          { id: 2, name: 'Pet Sitting', description: 'In-home pet sitting and care' },
          { id: 3, name: 'Grooming', description: 'Pet grooming and styling' },
          { id: 4, name: 'Training', description: 'Pet training and behavior' },
          { id: 5, name: 'Veterinary', description: 'Veterinary care services' },
          { id: 6, name: 'Boarding', description: 'Pet boarding and daycare' },
          { id: 7, name: 'Pet Taxi', description: 'Transportation services' },
          { id: 8, name: 'Daycare', description: 'Daytime pet care' },
        ]);
      }
    };

    loadServiceTypes();
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const addLanguage = () => {
    const normalizedLanguage = newLanguage.trim();
    if (!normalizedLanguage || formData.languages.includes(normalizedLanguage)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      languages: [...prev.languages, normalizedLanguage],
    }));
    setNewLanguage('');
  };

  const removeLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((value) => value !== language),
    }));
  };

  const handleSubmit = async () => {
    let hasProfile = false;

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Please log in again to complete provider setup.');
      }

      if (!user?.is_provider) {
        const providerResponse = await fetch(`${getBaseUrl()}/auth/me/provider`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!providerResponse.ok) {
          const errorText = await providerResponse.text();
          throw new Error(`Failed to become provider: ${providerResponse.status} ${errorText}`);
        }

        await providerResponse.json();
        await checkAuth();
      }

      const checkResponse = await fetch(`${getBaseUrl()}/provider-profiles/my-profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      hasProfile = checkResponse.ok;

      const serviceTypeIds = formData.services
        .map((serviceName) => serviceTypes.find((serviceType) => serviceType.name === serviceName)?.id ?? null)
        .filter((serviceTypeId): serviceTypeId is number => serviceTypeId !== null);

      const profileData = {
        bio: formData.bio,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        service_radius_km: formData.service_radius ? parseFloat(formData.service_radius) : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years, 10) : null,
        languages: formData.languages,
        is_available: true,
        ...(hasProfile ? {} : { service_type_ids: serviceTypeIds }),
      };

      const method = hasProfile ? 'PUT' : 'POST';
      const endpoint = hasProfile ? '/provider-profiles/my-profile' : '/provider-profiles/';
      const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save provider profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // Keep the default message when the response is not JSON.
        }
        throw new Error(errorMessage);
      }

      await checkAuth();
      navigate('/profile');
    } catch (submitError: any) {
      console.error('Error saving provider profile:', submitError);
      setError(submitError.message || `Failed to ${hasProfile ? 'update' : 'create'} provider profile`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Person sx={{ mr: 1 }} />
              Basic Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t('services.bio') || 'Bio'}
                  value={formData.bio}
                  onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
                  placeholder="Tell potential clients about yourself, your experience with pets, and what makes you special..."
                  helperText="This will be displayed on your provider profile"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Work sx={{ mr: 1 }} />
              Services & Pricing
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Services You Offer</InputLabel>
                  <Select
                    multiple
                    value={formData.services}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, services: event.target.value as string[] }))
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={getServiceTypeLabel(t, value)} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {serviceTypes.map((type) => (
                      <MenuItem key={type.id} value={type.name}>
                        {getServiceTypeLabel(t, type.name)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('services.hourlyRate') || 'Hourly Rate (₪)'}
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, hourly_rate: event.target.value }))}
                  placeholder="50"
                  helperText="Optional - you can set different rates for different services"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Service Radius (km)"
                  type="number"
                  value={formData.service_radius}
                  onChange={(event) => setFormData((prev) => ({ ...prev, service_radius: event.target.value }))}
                  placeholder="10"
                  helperText="How far are you willing to travel for services?"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <School sx={{ mr: 1 }} />
              Experience & Languages
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  type="number"
                  value={formData.experience_years}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, experience_years: event.target.value }))
                  }
                  placeholder="2"
                  helperText="How many years have you been working with pets?"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Languages You Speak
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.languages.map((language) => (
                    <Chip
                      key={language}
                      label={language}
                      onDelete={() => removeLanguage(language)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    value={newLanguage}
                    onChange={(event) => setNewLanguage(event.target.value)}
                    placeholder="Add a language..."
                    size="small"
                    onKeyPress={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addLanguage();
                      }
                    }}
                  />
                  <Button onClick={addLanguage} variant="outlined" size="small">
                    Add
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CheckCircle sx={{ mr: 1 }} />
              Review & Complete
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile Summary
              </Typography>

              {formData.bio && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bio:
                  </Typography>
                  <Typography variant="body2">{formData.bio}</Typography>
                </Box>
              )}

              {formData.services.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Services:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {formData.services.map((service) => (
                      <Chip key={service} label={getServiceTypeLabel(t, service)} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {formData.hourly_rate && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hourly Rate:
                  </Typography>
                  <Typography variant="body2">₪{formData.hourly_rate}/hour</Typography>
                </Box>
              )}

              {formData.service_radius && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Service Radius:
                  </Typography>
                  <Typography variant="body2">{formData.service_radius} km</Typography>
                </Box>
              )}

              {formData.experience_years && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Experience:
                  </Typography>
                  <Typography variant="body2">{formData.experience_years} years</Typography>
                </Box>
              )}

              {formData.languages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Languages:
                  </Typography>
                  <Typography variant="body2">{formData.languages.join(', ')}</Typography>
                </Box>
              )}
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You need to be logged in to access this page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Set Up Your Provider Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Complete your provider profile to start receiving service requests from pet owners.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
