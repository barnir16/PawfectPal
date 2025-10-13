import React, { useState, useEffect } from 'react';
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
  AttachMoney,
  LocationOn,
  School,
  Language,
  CheckCircle,
} from '@mui/icons-material';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../api';

interface ServiceType {
  id: number;
  name: string;
  description?: string;
}

const steps = [
  'Basic Information',
  'Services & Pricing',
  'Experience & Languages',
  'Review & Complete'
];

export const ProviderProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const [formData, setFormData] = useState({
    bio: '',
    hourly_rate: '',
    service_radius: '',
    experience_years: '',
    languages: [] as string[],
    services: [] as string[],
  });

  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    try {
      const response = await api.get('/enhanced-provider-profiles/service-types');
      setServiceTypes(response.data);
    } catch (error) {
      console.error('Failed to load service types:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileData = {
        bio: formData.bio,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        service_radius: formData.service_radius ? parseFloat(formData.service_radius) : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        languages: formData.languages,
        services: formData.services,
      };

      await api.put('/enhanced-provider-profiles/my-profile', profileData);
      
      // Redirect to provider profile page
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Failed to update provider profile');
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
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, services: e.target.value as string[] }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {serviceTypes.map((type) => (
                      <MenuItem key={type.id} value={type.name}>
                        {type.name}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, service_radius: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
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
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add a language..."
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
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
              <Typography variant="h6" gutterBottom>Profile Summary</Typography>
              
              {formData.bio && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Bio:</Typography>
                  <Typography variant="body2">{formData.bio}</Typography>
                </Box>
              )}
              
              {formData.services.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Services:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {formData.services.map((service) => (
                      <Chip key={service} label={service} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {formData.hourly_rate && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Hourly Rate:</Typography>
                  <Typography variant="body2">₪{formData.hourly_rate}/hour</Typography>
                </Box>
              )}
              
              {formData.service_radius && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Service Radius:</Typography>
                  <Typography variant="body2">{formData.service_radius} km</Typography>
                </Box>
              )}
              
              {formData.experience_years && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Experience:</Typography>
                  <Typography variant="body2">{formData.experience_years} years</Typography>
                </Box>
              )}
              
              {formData.languages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Languages:</Typography>
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

  if (!user?.is_provider) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You need to be a service provider to access this page.
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
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            
            <Box>
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
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
