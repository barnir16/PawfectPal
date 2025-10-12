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
    return `${years} ${t('chat.yearsOld')}`;
  };

  const getGenderTranslation = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male': return t('chat.male');
      case 'female': return t('chat.female');
      case 'other': return t('chat.other');
      default: return t('chat.unknown');
    }
  };

  const getSpeciesTranslation = (species: string) => {
    switch (species?.toLowerCase()) {
      case 'dog': return t('dog');
      case 'cat': return t('cat');
      case 'bird': return t('bird');
      case 'fish': return t('fish');
      case 'reptile': return t('reptile');
      case 'small_animal': return t('smallAnimal');
      default: return species || t('chat.other');
    }
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
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Pets color="primary" />
                  {t('common.pets')} ({pets.length})
                </Typography>
                <Stack spacing={2}>
                  {pets.map((pet) => (
                    <Paper key={pet.id} elevation={2} sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.paper' }}>
                      <Stack direction="row" spacing={2}>
                        {/* Pet Avatar */}
                        <Avatar 
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            backgroundColor: 'primary.light',
                            fontSize: '1.5rem'
                          }}
                          src={pet.imageUrl}
                        >
                          {pet.imageUrl ? null : <Pets />}
                        </Avatar>
                        
                        {/* Pet Details */}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            {pet.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {getSpeciesTranslation(pet.type)} {pet.breed && `• ${pet.breed}`}
                          </Typography>
                          
                          {/* Pet Details Grid */}
                          <Grid container spacing={1} sx={{ mb: 1 }}>
                            {pet.birthDate && (
                              <Grid item xs={6}>
                                <Chip
                                  icon={<Cake />}
                                  label={`${t('chat.petAge')}: ${calculateAge(pet.birthDate)}`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              </Grid>
                            )}
                            {pet.weightKg && (
                              <Grid item xs={6}>
                                <Chip
                                  icon={<Scale />}
                                  label={`${t('chat.petWeight')}: ${pet.weightKg} ${pet.weightUnit}`}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                />
                              </Grid>
                            )}
                            {pet.gender && (
                              <Grid item xs={6}>
                                <Chip
                                  icon={<Pets />}
                                  label={`${t('chat.petGender')}: ${getGenderTranslation(pet.gender)}`}
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                />
                              </Grid>
                            )}
                            {pet.color && (
                              <Grid item xs={6}>
                                <Chip
                                  icon={<ColorLens />}
                                  label={`${t('chat.petColor')}: ${pet.color}`}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              </Grid>
                            )}
                          </Grid>
                          
                          {/* Health Status */}
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            {pet.isVaccinated && (
                              <Chip
                                icon={<Vaccines />}
                                label={t('chat.petVaccinated')}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                            {pet.isNeutered && (
                              <Chip
                                icon={<MedicalServices />}
                                label={t('chat.petNeutered')}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            )}
                            {pet.isMicrochipped && (
                              <Chip
                                icon={<CheckCircle />}
                                label={t('chat.petMicrochipped')}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          
                          {/* Health Issues */}
                          {pet.healthIssues && pet.healthIssues.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {t('chat.petHealthIssues')}:
                              </Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {pet.healthIssues.map((issue, index) => (
                                  <Chip
                                    key={index}
                                    label={issue}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          )}
                          
                          {/* Behavior Issues */}
                          {pet.behaviorIssues && pet.behaviorIssues.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {t('chat.petBehaviorIssues')}:
                              </Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {pet.behaviorIssues.map((issue, index) => (
                                  <Chip
                                    key={index}
                                    label={issue}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          )}
                          
                          {/* Medical Notes */}
                          {pet.medicalNotes && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {t('chat.petMedicalNotes')}:
                              </Typography>
                              <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', backgroundColor: 'action.hover', p: 1, borderRadius: 1 }}>
                                {pet.medicalNotes}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* General Notes */}
                          {pet.notes && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {t('chat.petNotes')}:
                              </Typography>
                              <Typography variant="body2" color="text.primary" sx={{ backgroundColor: 'action.hover', p: 1, borderRadius: 1 }}>
                                {pet.notes}
                              </Typography>
                            </Box>
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
