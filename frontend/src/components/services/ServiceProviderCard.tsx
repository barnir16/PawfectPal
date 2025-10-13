import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocationOn,
  Star,
  Work,
  Phone,
  Email,
  Message,
  Visibility,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ServiceRequestForm } from './ServiceRequestForm';
import type { ServiceProvider } from '../../types/services';

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  onRequestService?: (provider: ServiceProvider) => void;
  onContact?: (provider: ServiceProvider) => void;
  onViewProfile?: (provider: ServiceProvider) => void;
}

export const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({
  provider,
  onRequestService,
  onContact,
  onViewProfile,
}) => {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [requestModalOpen, setRequestModalOpen] = useState(false);

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

        {/* Rating */}
        {provider.provider_rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Star sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
            <Typography variant="body2" sx={{ mr: 1 }}>
              {provider.provider_rating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({provider.provider_rating_count || 0} {t('services.reviews') || 'reviews'})
            </Typography>
          </Box>
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
            startIcon={<Message />}
            onClick={() => setRequestModalOpen(true)}
            disabled={!provider.is_available}
          >
            {t('services.contactProvider')}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onViewProfile && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => onViewProfile(provider)}
              sx={{ flex: 1 }}
            >
              {t('services.viewProfile')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Service Request Modal */}
      <Dialog
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('services.contactProvider')} - {provider.full_name}
        </DialogTitle>
        <DialogContent>
          <ServiceRequestForm
            onSuccess={(requestId) => {
              console.log('Service request created:', requestId);
              if (onRequestService) {
                onRequestService(provider);
              }
              setRequestModalOpen(false);
              // Navigate to chat page
              navigate(`/chat/${requestId}`);
            }}
            onCancel={() => setRequestModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ServiceProviderCard;
