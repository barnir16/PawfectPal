import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  AccessTime,
  AttachMoney,
  Person,
  Pets,
  Message,
  Visibility,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ServiceRequestService } from '../../services/serviceRequests/serviceRequestService';
import type { ServiceRequest } from '../../types/services/serviceRequest';

export const ServiceRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await ServiceRequestService.getServiceRequest(parseInt(id));
        setRequest(data);
      } catch (err: any) {
        setError(err.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, t]);

  const handleStartChat = () => {
    if (request) {
      // Navigate to the dedicated chat page for better UX
      navigate(`/chat/${request.id}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || t('common.error')}
        </Alert>
        <Button onClick={() => navigate('/service-requests')} sx={{ mt: 2 }}>
          {t('common.back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/service-requests')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{request.title}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid component="div" item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('services.requestDetails')}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {request.description}
              </Typography>

              {request.special_requirements && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('services.specialRequirements')}
                  </Typography>
                  <Typography variant="body2">
                    {request.special_requirements}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid component="div" item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {request.location || t('services.locationNotSpecified')}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid component="div" item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {new Date(request.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>

                {request.budget_min && request.budget_max && (
                  <Grid component="div" item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        ${request.budget_min} - ${request.budget_max}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid component="div" item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Visibility sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {request.views_count} {t('services.views')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid component="div" item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('services.requestedBy')}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2 }}>
                  {request.user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {request.user?.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {request.user?.full_name}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                {t('services.pets')}
              </Typography>
              
              {request.pets && request.pets.length > 0 ? (
                <List dense>
                  {request.pets.map((pet) => (
                    <ListItem key={pet.id}>
                      <ListItemIcon>
                        <Pets />
                      </ListItemIcon>
                      <ListItemText
                        primary={pet.name}
                        secondary={`${pet.breed} - ${pet.age} ${t('pets.years')}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('services.noPetsSelected')}
                </Typography>
              )}

              <Box mt={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Message />}
                  onClick={handleStartChat}
                >
                  {t('services.startChat')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
