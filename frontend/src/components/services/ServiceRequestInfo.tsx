import React from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, Avatar, Divider } from '@mui/material';
import { Pets, Person, Schedule, LocationOn, Description } from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { ServiceRequest, Pet, User } from '../../types/services/service';

interface ServiceRequestInfoProps {
  serviceRequest: ServiceRequest;
  pets: Pet[];
  provider?: User;
  compact?: boolean;
}

export const ServiceRequestInfo: React.FC<ServiceRequestInfoProps> = ({
  serviceRequest,
  pets,
  provider,
  compact = false,
}) => {
  const { t } = useLocalization();

  const getServiceTypeTranslation = (serviceType: string) => {
    const serviceTypeMap: Record<string, string> = {
      'walking': t('walking'),
      'sitting': t('sitting'),
      'boarding': t('boarding'),
      'grooming': t('grooming'),
      'veterinary': t('veterinary'),
    };
    return serviceTypeMap[serviceType] || t('petCare');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'info';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      'open': t('chat.requestStatus.open'),
      'in_progress': t('chat.requestStatus.in_progress'),
      'completed': t('chat.requestStatus.completed'),
      'closed': t('chat.requestStatus.closed'),
    };
    return statusMap[status] || status;
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.background.paper,
        borderColor: (theme) => theme.palette.divider,
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600} color="primary.main">
              {serviceRequest.title}
            </Typography>
            <Chip 
              label={getStatusTranslation(serviceRequest.status)} 
              color={getStatusColor(serviceRequest.status) as any}
              size="small"
            />
          </Stack>

          {/* Service Type */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Pets color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">
              {t('common.serviceType')}: 
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {getServiceTypeTranslation(serviceRequest.service_type)}
            </Typography>
          </Stack>

          {/* Description */}
          {serviceRequest.description && (
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Description color="text.secondary" sx={{ fontSize: 20, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('common.description')}:
                </Typography>
                <Typography variant="body2">
                  {serviceRequest.description}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* Pets */}
          {pets.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Pets color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('common.pets')} ({pets.length}):
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {pets.map((pet) => (
                  <Chip
                    key={pet.id}
                    label={pet.name}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Provider */}
          {provider && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Person color="primary" sx={{ fontSize: 20 }} />
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {provider.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {t('common.provider')}: 
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {provider.username}
              </Typography>
            </Stack>
          )}

          {/* Location */}
          {serviceRequest.location && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOn color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                {t('common.location')}: 
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {serviceRequest.location}
              </Typography>
            </Stack>
          )}

          {/* Schedule */}
          {serviceRequest.scheduled_date && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Schedule color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                {t('common.scheduledDate')}: 
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {new Date(serviceRequest.scheduled_date).toLocaleDateString()}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
