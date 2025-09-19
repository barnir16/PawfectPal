import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Close,
  LocationOn,
  AttachMoney,
  Schedule,
  Person,
  Pets,
  Phone,
  Email,
  Message,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { ServiceRequestSummary } from '../../types/services/serviceRequest';

interface ServiceRequestDetailsModalProps {
  open: boolean;
  onClose: () => void;
  request: ServiceRequestSummary | null;
  onContactUser?: (request: ServiceRequestSummary) => void;
  onStartChat?: (request: ServiceRequestSummary) => void;
}

export const ServiceRequestDetailsModal: React.FC<ServiceRequestDetailsModalProps> = ({
  open,
  onClose,
  request,
  onContactUser,
  onStartChat
}) => {
  const { t } = useLocalization();

  if (!request) return null;

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

  const formatBudget = (min?: number, max?: number) => {
    if (min && max) return `₪${min} - ₪${max}`;
    if (min) return `₪${min}+`;
    if (max) return `Up to ₪${max}`;
    return 'Budget not specified';
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div">
            {request.title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Service Type and Status */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={t(`services.${request.service_type}`)}
                color={getServiceTypeColor(request.service_type)}
              />
              {request.is_urgent && (
                <Chip
                  label={t('services.isUrgent')}
                  color="error"
                />
              )}
              <Chip
                label={formatTimeAgo(request.created_at)}
                variant="outlined"
              />
            </Box>
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              {t('services.description')}
            </Typography>
            <Typography variant="body1" paragraph>
              {request.description}
            </Typography>
          </Grid>

          {/* User Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              {t('services.requestedBy')}
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    {request.user.full_name?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {request.user.full_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{request.user.username}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Message />}
                    onClick={() => onStartChat?.(request)}
                  >
                    {t('services.startChat')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    onClick={() => onContactUser?.(request)}
                  >
                    {t('services.contact')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pet Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              {t('services.pets')} ({request.pets.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {request.pets.map((pet) => (
                <Card key={pet.id} variant="outlined" sx={{ minWidth: 200 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                        {pet.name[0]}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {pet.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {pet.breed_type} • {pet.breed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pet.age} years old
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Request Details */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              {t('services.requestDetails')}
            </Typography>
            <Grid container spacing={2}>
              {request.location && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle2">
                        {t('services.location')}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {request.location}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {(request.budget_min || request.budget_max) && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle2">
                        {t('services.budget')}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatBudget(request.budget_min, request.budget_max)}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="subtitle2">
                      {t('services.posted')}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {formatTimeAgo(request.created_at)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Stats */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {request.views_count} {t('services.views')} • {request.responses_count} {t('services.responses')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.close')}
        </Button>
        <Button
          variant="contained"
          onClick={() => onStartChat?.(request)}
          startIcon={<Message />}
        >
          {t('services.startChat')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
