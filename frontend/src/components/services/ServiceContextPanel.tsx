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
  Image as ImageIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user } = useAuth();

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    
    // Calculate age in months first for more accuracy
    const yearDiff = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    
    // Adjust for day difference
    if (dayDiff < 0) {
      totalMonths -= 1;
    }
    
    // If less than 12 months, return months
    if (totalMonths < 12) {
      return totalMonths === 0 ? t('chat.monthsOld') : `${totalMonths} ${t('chat.monthsOld')}`;
    }
    
    // If 12+ months, return years
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;
    
    if (remainingMonths === 0) {
      return `${years} ${t('chat.yearsOld')}`;
    } else {
      return `${years} ${t('chat.yearsOld')} ${remainingMonths} ${t('chat.monthsOld')}`;
    }
  };

  // Determine if current user is the requester or provider
  const isRequester = user?.id === serviceRequest.user_id;
  const isProvider = user?.is_provider && !isRequester;

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
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto',
      backgroundColor: 'white',
      borderRadius: 2,
      m: 2,
      boxShadow: 3,
    }}>
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

      {/* User Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {isRequester ? t('services.you') : isProvider ? t('services.client') : t('services.requestedBy')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2 }}>
              {isRequester ? (user?.username?.[0] || 'U') : (serviceRequest.user?.username?.[0] || 'U')}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {isRequester ? (user?.username || 'You') : (serviceRequest.user?.username || 'Unknown User')}
              </Typography>
              {!isRequester && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star fontSize="small" color="warning" />
                  <Typography variant="caption" color="text.secondary">
                    4.8 (24 reviews)
                  </Typography>
                  <Verified fontSize="small" color="primary" />
                </Box>
              )}
            </Box>
          </Box>

          {!isRequester && (
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
                {t('services.sendEmail')}
              </Button>
            </Stack>
          )}
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
            <Stack spacing={2}>
              {serviceRequest.pets.map((pet: Pet) => (
                <Card key={pet.id} sx={{ 
                  borderRadius: 3,
                  boxShadow: 2,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  backgroundColor: 'white',
                  '&:hover': {
                    boxShadow: 4,
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out',
                  }
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        src={pet.imageUrl}
                        sx={{ 
                          width: 50, 
                          height: 50,
                          border: '2px solid',
                          borderColor: 'primary.main',
                        }}
                      >
                        {pet.name[0]}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                          {pet.name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                          {pet.type} • {pet.breed}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {pet.birthDate ? calculateAge(pet.birthDate) : (pet.age ? `${pet.age} years old` : 'Age unknown')} • {pet.gender || 'Unknown'}
                        </Typography>
                        
                        {pet.weightKg && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {pet.weightKg} {pet.weightUnit}
                          </Typography>
                        )}
                        
                        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                          {pet.isVaccinated && (
                            <Chip
                              label="Vaccinated"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {pet.isNeutered && (
                            <Chip
                              label="Neutered"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {pet.isMicrochipped && (
                            <Chip
                              label="Microchipped"
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Stack>
                        
                        {pet.healthIssues.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Warning fontSize="small" color="warning" />
                            <Typography variant="caption" color="warning.main">
                              Health: {pet.healthIssues.join(', ')}
                            </Typography>
                          </Box>
                        )}
                        
                        {pet.behaviorIssues.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Warning fontSize="small" color="warning" />
                            <Typography variant="caption" color="warning.main">
                              Behavior: {pet.behaviorIssues.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
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
              startIcon={<ImageIcon />}
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
          {serviceRequest.status === 'open' && isProvider && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('services.serviceActions')}
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleServiceStatusUpdate('confirmed')}
                >
                  {t('services.acceptService')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleServiceStatusUpdate('cancelled')}
                >
                  {t('services.declineService')}
                </Button>
              </Stack>
            </Box>
          )}

          {serviceRequest.status === 'open' && isRequester && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('services.serviceActions')}
              </Typography>
              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleServiceStatusUpdate('cancelled')}
                >
                  {t('services.cancelRequest')}
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
