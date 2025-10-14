import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  Avatar, 
  Divider,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Pets, 
  Person, 
  Schedule, 
  LocationOn, 
  Description,
  AttachMoney,
  AccessTime,
  Phone,
  Email,
  Cake,
  Scale,
  ColorLens,
  MedicalServices,
  Vaccines,
  CalendarToday,
  Star,
  CheckCircle,
  Warning
} from '@mui/icons-material';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateAge = (pet: Pet) => {
    // If we have a direct age value and birthday is not given, use the age
    if (pet.age && !pet.isBirthdayGiven) {
      return pet.age;
    }
    
    // If we have a birth date and birthday is given, calculate from birth date
    if (pet.birthDate && pet.isBirthdayGiven) {
      const birth = new Date(pet.birthDate);
      const today = new Date();
      const ageInYears = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return ageInYears - 1;
      }
      return ageInYears;
    }
    
    // Fallback to direct age if available
    return pet.age || 0;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Service Request Header */}
      <Paper 
        elevation={1}
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
              {serviceRequest.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {getServiceTypeTranslation(serviceRequest.service_type)}
            </Typography>
          </Box>
          <Chip 
            label={getStatusTranslation(serviceRequest.status)} 
            color={getStatusColor(serviceRequest.status) as any}
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Stack>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={2}>
        {/* Left Column - Service Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description color="primary" />
              Service Details
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Pets color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Service Type"
                  secondary={getServiceTypeTranslation(serviceRequest.service_type)}
                />
              </ListItem>
              
              {serviceRequest.description && (
                <ListItem>
                  <ListItemIcon>
                    <Description color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Description"
                    secondary={serviceRequest.description}
                  />
                </ListItem>
              )}
              
              {serviceRequest.location && (
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Location"
                    secondary={serviceRequest.location}
                  />
                </ListItem>
              )}
              
              {serviceRequest.scheduled_date && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Scheduled Date"
                    secondary={formatDate(serviceRequest.scheduled_date)}
                  />
                </ListItem>
              )}
              
              {(serviceRequest.budget_min || serviceRequest.budget_max) && (
                <ListItem>
                  <ListItemIcon>
                    <AttachMoney color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Budget"
                    secondary={
                      serviceRequest.budget_min && serviceRequest.budget_max
                        ? `${formatCurrency(serviceRequest.budget_min)} - ${formatCurrency(serviceRequest.budget_max)}`
                        : serviceRequest.budget_min
                        ? `From ${formatCurrency(serviceRequest.budget_min)}`
                        : `Up to ${formatCurrency(serviceRequest.budget_max)}`
                    }
                  />
                </ListItem>
              )}
              
              {serviceRequest.is_urgent && (
                <ListItem>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Urgent Request"
                    secondary="This is an urgent service request"
                    primaryTypographyProps={{ color: 'warning.main' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right Column - People & Pets */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              People & Pets
            </Typography>
            
            {/* Client Information */}
            {serviceRequest.user && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  Client
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {serviceRequest.user.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {serviceRequest.user.full_name || serviceRequest.user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{serviceRequest.user.username}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Provider Information */}
            {provider && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star color="primary" />
                  Provider
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {provider.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {provider.full_name || provider.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{provider.username}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Pets Information */}
            {pets.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Pets color="primary" />
                  Pets ({pets.length})
                </Typography>
                <Stack spacing={2}>
                  {pets.map((pet) => (
                    <Paper key={pet.id} elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ width: 50, height: 50, backgroundColor: 'primary.light' }}
                          src={pet.imageUrl}
                        >
                          <Pets />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {pet.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pet.type} {pet.breed && `• ${pet.breed}`}
                          </Typography>
                          
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            {(pet.birthDate || pet.age) && (
                              <Chip
                                icon={<Cake />}
                                label={`${calculateAge(pet)} years old`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {pet.weightKg && (
                              <Chip
                                icon={<Scale />}
                                label={`${pet.weightKg} ${pet.weightUnit}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {pet.color && (
                              <Chip
                                icon={<ColorLens />}
                                label={pet.color}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {pet.gender && (
                              <Chip
                                icon={<Pets />}
                                label={pet.gender}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {pet.isVaccinated && (
                              <Chip
                                icon={<Vaccines />}
                                label="Vaccinated"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                            {pet.isNeutered && (
                              <Chip
                                icon={<MedicalServices />}
                                label="Neutered"
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            )}
                            {pet.isMicrochipped && (
                              <Chip
                                icon={<CheckCircle />}
                                label="Microchipped"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          
                          {/* Health Issues */}
                          {pet.healthIssues && pet.healthIssues.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                Health Issues: {pet.healthIssues.join(', ')}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Behavior Issues */}
                          {pet.behaviorIssues && pet.behaviorIssues.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                Behavior Issues: {pet.behaviorIssues.join(', ')}
                              </Typography>
                            </Box>
                          )}
                          
                          {pet.medicalNotes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                              Medical Notes: {pet.medicalNotes}
                            </Typography>
                          )}
                          
                          {pet.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Notes: {pet.notes}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
