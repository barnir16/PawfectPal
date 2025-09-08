import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Rating,
  Chip,
  Button,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import type { ServiceProvider } from '../../../types/services';
import { useLocalization } from '../../../contexts/LocalizationContext';

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  onBook?: (provider: ServiceProvider) => void;
}

export const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({
  provider,
  onBook,
}) => {
  const { t } = useLocalization();

  const handleBookClick = () => {
    if (onBook) {
      onBook(provider);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        {/* Provider Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar 
            src={provider.profile_image} 
            alt={provider.full_name || provider.username}
            sx={{ width: 56, height: 56 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {provider.full_name || provider.username}
            </Typography>
            {provider.verified && (
              <Chip 
                label="Verified" 
                size="small" 
                color="success" 
                sx={{ mb: 1 }}
              />
            )}
          </Box>
        </Box>

        {/* Rating */}
        {provider.provider_rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Rating value={provider.provider_rating} readOnly size="small" />
            <Typography variant="caption">
              ({provider.provider_rating.toFixed(1)})
            </Typography>
            {provider.reviews_count && (
              <Typography variant="caption" color="text.secondary">
                • {provider.reviews_count} reviews
              </Typography>
            )}
          </Box>
        )}

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

        {/* Services */}
        {provider.provider_services && provider.provider_services.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Services:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {provider.provider_services.slice(0, 3).map((service) => (
                <Chip 
                  key={service} 
                  label={service} 
                  size="small" 
                  variant="outlined"
                />
              ))}
              {provider.provider_services.length > 3 && (
                <Chip 
                  label={`+${provider.provider_services.length - 3}`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Price and Experience */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {provider.provider_hourly_rate && (
            <Typography variant="h6" color="primary">
              ${provider.provider_hourly_rate}/hr
            </Typography>
          )}
          {provider.experience_years && (
            <Typography variant="caption" color="text.secondary">
              {provider.experience_years} years exp.
            </Typography>
          )}
        </Box>

        {/* Additional Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {provider.distance_km && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {provider.distance_km.toFixed(1)} km away
              </Typography>
            </Box>
          )}
          {provider.response_time_minutes && (
            <Typography variant="caption" color="text.secondary">
              Responds in ~{provider.response_time_minutes}min
            </Typography>
          )}
        </Box>

        {/* Availability Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: provider.is_available ? 'success.main' : 'error.main',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {provider.is_available ? 'Available' : 'Unavailable'}
          </Typography>
        </Box>
      </CardContent>

      {/* Action Button */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleBookClick}
          disabled={!provider.is_available}
        >
          {t('services.bookService')}
        </Button>
      </Box>
    </Card>
  );
};
