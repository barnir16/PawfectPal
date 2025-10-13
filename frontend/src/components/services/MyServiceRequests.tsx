import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Message,
  LocationOn,
  AccessTime,
  AttachMoney,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ServiceRequestService } from '../../services/serviceRequests/serviceRequestService';
import type { ServiceRequest } from '../../types/services/serviceRequest';

export const MyServiceRequests: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const data = await ServiceRequestService.getMyServiceRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (window.confirm(t('common.confirm'))) {
      try {
        await ServiceRequestService.deleteServiceRequest(id);
        setRequests(requests.filter(req => req.id !== id));
      } catch (err: any) {
        setError(err.message || t('common.error'));
      }
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('services.myRequests')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/marketplace')}
        >
          {t('services.createRequest')}
        </Button>
      </Box>

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {t('services.noRequestsFound')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('services.createFirstRequest')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/marketplace')}
          >
            {t('services.createRequest')}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {requests.map((request) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" noWrap>
                      {request.title}
                    </Typography>
                    <Chip
                      label={t(`services.status.${request.status}`)}
                      color={getStatusColor(request.status) as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {request.description.length > 100 
                      ? `${request.description.substring(0, 100)}...`
                      : request.description
                    }
                  </Typography>

                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {request.location || t('services.locationNotSpecified')}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <AccessTime sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(request.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {request.budget_min && request.budget_max && (
                    <Box display="flex" alignItems="center" mb={2}>
                      <AttachMoney sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        ${request.budget_min} - ${request.budget_max}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {request.views_count} {t('services.views')} • {request.responses_count} {t('services.responses')}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/service-requests/${request.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/chat/${request.id}`)}
                      >
                        <Message />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRequest(request.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/marketplace')}
      >
        <Add />
      </Fab>
    </Box>
  );
};
