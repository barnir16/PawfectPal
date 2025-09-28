import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Stack,
} from '@mui/material';
import {
  Pets,
  LocationOn,
  Schedule,
  AttachMoney,
  Person,
  Star,
  Phone,
  Email,
  Verified,
  Warning,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { railwayConfig } from '../../utils/railwayConfig';
import type { ServiceRequest } from '../../types/services/serviceRequest';
import type { Pet } from '../../types/pets/pet';

interface ServiceContextPanelProps {
  serviceRequest: ServiceRequest;
  onAction?: (action: string, data?: any) => void;
}

export const ServiceContextPanel: React.FC<ServiceContextPanelProps> = ({
  serviceRequest,
  onAction,
}) => {
  const { t } = useLocalization();

  const handleQuickAction = (action: string, data?: any) => {
    onAction?.(action, data);
  };

  const handleLocationShare = () => {
    const features = railwayConfig.getFeatureAvailability();
    
    if (features.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleQuickAction('share_location', {
            latitude,
            longitude,
            address: serviceRequest.location,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to manual location entry
          handleQuickAction('share_location', {
            address: serviceRequest.location,
            fallback: true,
          });
        }
      );
    } else {
      // Fallback to manual location entry for web-only mode
      handleQuickAction('share_location', {
        address: serviceRequest.location,
        fallback: true,
      });
    }
  };

  const handleServiceStatusUpdate = (status: string) => {
    handleQuickAction('update_service_status', {
      status,
      serviceRequestId: serviceRequest.id,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatBudget = () => {
    if (serviceRequest.budget_min && serviceRequest.budget_max) {
      return `₪${serviceRequest.budget_min} - ₪${serviceRequest.budget_max}`;
    } else if (serviceRequest.budget_min) {
      return `₪${serviceRequest.budget_min}+`;
    } else if (serviceRequest.budget_max) {
      return `Up to ₪${serviceRequest.budget_max}`;
    }
    return 'Budget not specified';
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

  return (
    <Box sx={{ width: 300, height: '100%', overflow: 'auto' }}>
      {/* Service Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {serviceRequest.title}
            </Typography>
            <Chip
              label={t(`services.requestStatus.${serviceRequest.status}`)}
              color={getStatusColor(serviceRequest.status)}
              size="small"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {serviceRequest.description}
          </Typography>

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" color="action" />
              <Typography variant="caption">
                {t('services.posted')}: {formatDate(serviceRequest.created_at)}
              </Typography>
            </Box>
            
            {serviceRequest.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="caption">{serviceRequest.location}</Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney fontSize="small" color="action" />
              <Typography variant="caption">{formatBudget()}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Requester Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {t('services.requestedBy')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2 }}>
              {serviceRequest.user?.username?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {serviceRequest.user?.username || 'Unknown User'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star fontSize="small" color="warning" />
                <Typography variant="caption" color="text.secondary">
                  4.8 (24 reviews)
                </Typography>
                <Verified fontSize="small" color="primary" />
              </Box>
            </Box>
          </Box>

          <Stack spacing={1}>
            <Button
              size="small"
              startIcon={<Phone />}
              onClick={() => handleQuickAction('call')}
            >
              {t('services.contact')}
            </Button>
            <Button
              size="small"
              startIcon={<Email />}
              onClick={() => handleQuickAction('email')}
            >
              Send Email
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Pet Information */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('services.pets')}
          </Typography>
          
          {serviceRequest.pets && serviceRequest.pets.length > 0 ? (
            <List dense>
              {serviceRequest.pets.map((pet: Pet) => (
                <ListItem key={pet.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={pet.imageUrl}
                      sx={{ width: 40, height: 40 }}
                    >
                      {pet.name[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={pet.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {pet.type} • {pet.breed}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pet.age ? `${pet.age} years old` : 'Age unknown'}
                        </Typography>
                        {pet.healthIssues.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Warning fontSize="small" color="warning" />
                            <Typography variant="caption" color="warning.main">
                              Health concerns
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('services.noPetsSelected')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {t('common.quickActions')}
          </Typography>
          
          <Stack spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleLocationShare}
              startIcon={<LocationOn />}
              disabled={!railwayConfig.getFeatureAvailability().geolocation && !serviceRequest.location}
            >
              {t('services.shareLocation')}
              {!railwayConfig.getFeatureAvailability().geolocation && (
                <Chip label="Address only" size="small" sx={{ ml: 1 }} />
              )}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickAction('request_photos')}
              startIcon={<Image />}
              disabled={!railwayConfig.getFeatureAvailability().fileUpload}
            >
              {t('services.requestPhotos')}
              {!railwayConfig.getFeatureAvailability().fileUpload && (
                <Chip label="Web only" size="small" sx={{ ml: 1 }} />
              )}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickAction('schedule_meeting')}
              startIcon={<Schedule />}
            >
              {t('services.scheduleMeeting')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickAction('share_instructions')}
              startIcon={<Pets />}
            >
              {t('services.shareInstructions')}
            </Button>
          </Stack>

          {/* Service Status Actions */}
          {serviceRequest.status === 'open' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Service Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleServiceStatusUpdate('confirmed')}
                >
                  Accept Service
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleServiceStatusUpdate('cancelled')}
                >
                  Decline Service
                </Button>
              </Stack>
            </Box>
          )}

          {serviceRequest.status === 'confirmed' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Service Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => handleServiceStatusUpdate('in_progress')}
                >
                  Start Service
                </Button>
              </Stack>
            </Box>
          )}

          {serviceRequest.status === 'in_progress' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Service Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleServiceStatusUpdate('completed')}
                >
                  Complete Service
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
