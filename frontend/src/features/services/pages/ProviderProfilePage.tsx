import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  LocationOn,
  Star,
  Work,
  Phone,
  Email,
  Message,
  ArrowBack,
  CheckCircle,
  Language,
  School,
  Shield,
  AttachMoney,
  Schedule,
  Pets,
} from '@mui/icons-material';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { ProviderRating } from '../../../components/services/ProviderRating';
import { ServiceProviderService } from '../../../services/serviceProviders/serviceProviderService';
import { ServiceProvider } from '../../../types/services/service';

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const providerData = await ServiceProviderService.getProvider(Number(id));
        setProvider(providerData);
      } catch (err: any) {
        setError(err.message || 'Failed to load provider profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  const getServiceTypeColor = (serviceType: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' } = {
      walking: 'primary',
      sitting: 'secondary',
      boarding: 'success',
      grooming: 'warning',
      veterinary: 'error',
      training: 'info',
      'אילוף': 'info',
    };
    return colors[serviceType] || 'default';
  };

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable ? 'success' : 'error';
  };

  const getAvailabilityText = (isAvailable: boolean) => {
    return isAvailable ? t('services.available') : t('services.unavailable');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/bookservice')}
          sx={{ mt: 2 }}
        >
          {t('common.back') || 'Back to Providers'}
        </Button>
      </Box>
    );
  }

  if (!provider) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Provider not found</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/bookservice')}
          sx={{ mt: 2 }}
        >
          {t('common.back') || 'Back to Providers'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/bookservice')}
          sx={{ mr: 2 }}
        >
          {t('common.back') || 'Back'}
        </Button>
        <Typography variant="h4" component="h1">
          {provider.full_name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Main Profile */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <Avatar
                  src={provider.profile_image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&seed=default"}
                  alt={provider.full_name}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mr: 3,
                    border: '4px solid',
                    borderColor: getAvailabilityColor(provider.is_available) + '.main'
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {provider.full_name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    @{provider.username}
                  </Typography>
                  
                  {/* Availability Status */}
                  <Chip
                    label={getAvailabilityText(provider.is_available)}
                    color={getAvailabilityColor(provider.is_available)}
                    sx={{ mb: 2 }}
                  />

                  {/* Rating */}
                  {provider.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={provider.rating} precision={0.1} readOnly />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {provider.rating.toFixed(1)} ({provider.review_count || 0} reviews)
                      </Typography>
                    </Box>
                  )}

                  {/* Contact Button */}
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Message />}
                    disabled={!provider.is_available}
                    onClick={() => {
                      // TODO: Implement contact functionality
                      console.log('Contact provider:', provider.id);
                    }}
                  >
                    {t('services.contactProvider')}
                  </Button>
                </Box>
              </Box>

              {/* Bio */}
              {provider.provider_bio && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('services.about') || 'About'}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {provider.provider_bio}
                  </Typography>
                </Box>
              )}

              {/* Service Types */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('services.services')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {provider.provider_services.map((serviceType) => (
                    <Chip
                      key={serviceType}
                      label={t(`services.${serviceType}`) || serviceType}
                      color={getServiceTypeColor(serviceType)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Experience & Certifications */}
          {(provider.experience_years || provider.certifications) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('services.experience') || 'Experience & Certifications'}
                </Typography>
                
                {provider.experience_years && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Work sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {provider.experience_years} {t('services.yearsExperience') || 'years of experience'}
                    </Typography>
                  </Box>
                )}

                {provider.certifications && provider.certifications.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('services.certifications') || 'Certifications'}
                    </Typography>
                    <List dense>
                      {provider.certifications.map((cert, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={cert} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={4}>
          {/* Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('services.contactInfo') || 'Contact Information'}
              </Typography>
              
              {provider.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {provider.location}
                  </Typography>
                </Box>
              )}

              {provider.languages && provider.languages.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Language sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {provider.languages.join(', ')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Availability */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('services.pricing') || 'Pricing & Availability'}
              </Typography>
              
              {provider.provider_hourly_rate && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    ₪{provider.provider_hourly_rate}/hour
                  </Typography>
                </Box>
              )}

              {provider.service_radius && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {t('services.serviceRadius') || 'Service radius'}: {provider.service_radius}km
                  </Typography>
                </Box>
              )}

              {provider.completed_bookings && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Pets sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {provider.completed_bookings} {t('services.completedBookings') || 'completed bookings'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Verification */}
          {provider.verified && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('services.verification') || 'Verification'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Shield sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" color="success.main">
                    {t('services.verifiedProvider') || 'Verified Provider'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Rating and Reviews */}
          <ProviderRating
            providerId={provider.id}
            currentRating={provider.rating || 0}
            reviewCount={provider.review_count || 0}
            onRatingUpdate={(rating, reviewCount) => {
              setProvider(prev => prev ? {
                ...prev,
                rating,
                review_count: reviewCount
              } : null);
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
