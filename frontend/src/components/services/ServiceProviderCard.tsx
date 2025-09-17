import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Grid,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  Star,
  Work,
  Phone,
  Email,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ServiceBookingModal } from './ServiceBookingModal';
import type { ServiceProvider } from '../../types/services';

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  onBook: (provider: ServiceProvider) => void;
  onContact?: (provider: ServiceProvider) => void;
  onViewProfile?: (provider: ServiceProvider) => void;
}

export const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({
  provider,
  onBook,
  onContact,
  onViewProfile,
}) => {
  const { t } = useLocalization();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const getServiceTypeColor = (serviceType: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' } = {
      walking: 'primary',
      sitting: 'secondary',
      boarding: 'success',
      grooming: 'warning',
      veterinary: 'error',
    };
    return colors[serviceType] || 'default';
  };

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable ? 'success' : 'error';
  };

  const getAvailabilityText = (isAvailable: boolean) => {
    return isAvailable ? t('services.available') : t('services.unavailable');
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      {/* Header with Avatar and Basic Info */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            src={provider.profile_image}
            alt={provider.full_name}
            sx={{ 
              width: 80, 
              height: 80, 
              mr: 2,
              border: '3px solid',
              borderColor: getAvailabilityColor(provider.is_available) + '.main'
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {provider.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{provider.username}
            </Typography>
            

            {/* Availability Status */}
            <Chip
              label={getAvailabilityText(provider.is_available)}
              color={getAvailabilityColor(provider.is_available)}
              size="small"
              sx={{ mb: 1 }}
            />
          </Box>
        </Box>

        {/* Service Types */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('services.services')}:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {provider.provider_services.map((serviceType) => (
              <Chip
                key={serviceType}
                label={t(`services.${serviceType}`)}
                color={getServiceTypeColor(serviceType)}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Bio */}
        {provider.provider_bio && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {provider.provider_bio}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Provider Stats */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {provider.provider_hourly_rate && (
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Work sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  ₪{provider.provider_hourly_rate}/hr
                </Typography>
              </Box>
            </Grid>
          )}
          
          {provider.completed_bookings && (
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {provider.completed_bookings} {t('services.completedBookings')}
                </Typography>
              </Box>
            </Grid>
          )}


          {provider.distance_km && (
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {provider.distance_km}km
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Languages */}
        {provider.languages && provider.languages.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('services.languages')}: {provider.languages.join(', ')}
            </Typography>
          </Box>
        )}

        {/* Verification Badge */}
        {provider.verified && (
          <Chip
            label={t('services.verified')}
            color="success"
            size="small"
            sx={{ mb: 2 }}
          />
        )}
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setBookingModalOpen(true)}
            disabled={!provider.is_available}
          >
            {t('services.bookNow')}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onContact && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Phone />}
              onClick={() => onContact(provider)}
              sx={{ flex: 1 }}
            >
              {t('services.contact')}
            </Button>
          )}
          
          {onViewProfile && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onViewProfile(provider)}
              sx={{ flex: 1 }}
            >
              {t('services.viewProfile')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Booking Modal */}
      <ServiceBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        provider={provider}
        onConfirm={(bookingData) => {
          console.log('Booking confirmed:', bookingData);
          onBook(provider);
          setBookingModalOpen(false);
        }}
      />
    </Card>
  );
};

export default ServiceProviderCard;
