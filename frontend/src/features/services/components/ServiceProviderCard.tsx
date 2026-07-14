import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as ClockIcon,
  Verified as VerifiedIcon,
  WorkspacePremium as ExpIcon,
} from '@mui/icons-material';
import type { ServiceProvider } from '../../../types/services';
import { useLocalization } from '../../../contexts/LocalizationContext';

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  onBook?: (provider: ServiceProvider) => void;
}

// Maps service type strings to short readable labels
const shortLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({
  provider,
  onBook,
}) => {
  const { t } = useLocalization();
  const isAvailable = provider.is_available;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'rgba(244,162,97,0.15)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Gradient header strip */}
      <Box
        sx={{
          height: 72,
          background: 'linear-gradient(135deg, #F4A261 0%, #2A9D8F 100%)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Availability dot in corner */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(4px)',
            borderRadius: 4,
            px: 1,
            py: 0.4,
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: isAvailable ? '#52B788' : '#aaa',
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </Typography>
        </Box>

        {/* Floating avatar */}
        <Avatar
          src={provider.profile_image || undefined}
          alt={provider.full_name || provider.username}
          sx={{
            width: 64,
            height: 64,
            position: 'absolute',
            bottom: -24,
            left: 20,
            border: '3px solid white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            bgcolor: '#F4A261',
            fontSize: '1.5rem',
            fontWeight: 700,
          }}
        >
          {(provider.full_name || provider.username || '?')[0].toUpperCase()}
        </Avatar>
      </Box>

      {/* Body */}
      <CardContent sx={{ flex: 1, pt: 4, px: 2.5, pb: 1.5 }}>
        {/* Name + verified */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            {provider.full_name || provider.username}
          </Typography>
          {provider.verified && (
            <VerifiedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          )}
        </Box>

        {/* Meta row: experience + response time */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
          {provider.experience_years && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <ExpIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {provider.experience_years}yr exp
              </Typography>
            </Box>
          )}
          {provider.response_time_minutes && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <ClockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                ~{provider.response_time_minutes}min reply
              </Typography>
            </Box>
          )}
          {provider.distance_km && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <LocationIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {provider.distance_km.toFixed(1)}km
              </Typography>
            </Box>
          )}
        </Box>

        {/* Bio */}
        {provider.provider_bio && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
            }}
          >
            {provider.provider_bio}
          </Typography>
        )}

        {/* Services */}
        {provider.provider_services && provider.provider_services.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {provider.provider_services.slice(0, 3).map((s) => (
              <Chip
                key={s}
                label={shortLabel(s)}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 22,
                  bgcolor: 'rgba(244,162,97,0.1)',
                  color: 'primary.dark',
                  border: '1px solid rgba(244,162,97,0.3)',
                }}
              />
            ))}
            {provider.provider_services.length > 3 && (
              <Chip
                label={`+${provider.provider_services.length - 3}`}
                size="small"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>
        )}
      </CardContent>

      {/* Footer: price + book */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'rgba(244,162,97,0.12)',
          bgcolor: 'rgba(244,162,97,0.03)',
        }}
      >
        {provider.provider_hourly_rate ? (
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary.dark" lineHeight={1}>
              ${provider.provider_hourly_rate}
            </Typography>
            <Typography variant="caption" color="text.disabled">/hr</Typography>
          </Box>
        ) : (
          <Box />
        )}

        <Button
          variant="contained"
          size="small"
          onClick={() => onBook?.(provider)}
          disabled={!isAvailable}
          sx={{
            px: 2.5,
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 2px 8px rgba(244,162,97,0.4)' },
          }}
        >
          {t('services.bookService')}
        </Button>
      </Box>
    </Card>
  );
};

export default ServiceProviderCard;
