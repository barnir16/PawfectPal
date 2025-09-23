import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Avatar,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Search,
  LocationOn,
  AttachMoney,
  Schedule,
  Person,
  Pets,
  FilterList,
  Refresh,
  Add,
  Visibility,
  Message,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ServiceRequestService } from '../../services/serviceRequests/serviceRequestService';
import type { ServiceRequestSummary, ServiceRequestFilters } from '../../types/services/serviceRequest';

export const ServiceRequestBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceRequestFilters>({
    service_type: '',
    location: '',
    budget_min: undefined,
    budget_max: undefined,
    is_urgent: undefined,
    limit: 20,
    offset: 0
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Load service requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ServiceRequestService.getServiceRequests(filters);
        setRequests(data);
        setFilteredRequests(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load service requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [filters]);

  // Filter requests based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const filtered = requests.filter(request =>
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRequests(filtered);
  }, [searchQuery, requests]);

  const handleFilterChange = (key: keyof ServiceRequestFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset to first page when filters change
    }));
  };

  const handleRefresh = () => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ServiceRequestService.getServiceRequests(filters);
        setRequests(data);
        setFilteredRequests(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load service requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  };

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

  const renderRequestCard = (request: ServiceRequestSummary) => (
    <Card
      key={request.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={t(`services.${request.service_type}`)}
              color={getServiceTypeColor(request.service_type)}
              size="small"
            />
            {request.is_urgent && (
              <Chip
                label={t('services.isUrgent')}
                color="error"
                size="small"
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatTimeAgo(request.created_at)}
          </Typography>
        </Box>

        {/* Title and Description */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {request.title}
        </Typography>
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
          {request.description}
        </Typography>

        {/* User Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
            {request.user.full_name?.[0] || 'U'}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {request.user.full_name}
          </Typography>
        </Box>

        {/* Pet Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Pets sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {request.pets.length} {request.pets.length === 1 ? 'pet' : 'pets'}
          </Typography>
        </Box>

        {/* Details */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {request.location && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {request.location}
              </Typography>
            </Box>
          )}
          
          {(request.budget_min || request.budget_max) && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatBudget(request.budget_min, request.budget_max)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {request.views_count} views
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {request.responses_count} responses
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/service-requests/${request.id}`)}
            startIcon={<Visibility />}
            sx={{ flex: 1 }}
          >
            {t('services.viewDetails')}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate(`/service-requests/${request.id}/chat`)}
            startIcon={<Message />}
            sx={{ flex: 1 }}
          >
            {t('services.contactUser')}
          </Button>
        </Box>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('services.browseRequests')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/bookservice')}
        >
          {t('services.createRequest')}
        </Button>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">
            {t('services.filters')}
          </Typography>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          {/* Search */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder={t('services.searchRequests')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Service Type */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('services.serviceType')}</InputLabel>
              <Select
                value={filters.service_type || ''}
                onChange={(e) => handleFilterChange('service_type', e.target.value || undefined)}
                label={t('services.serviceType')}
              >
                <MenuItem value="">{t('services.allServices')}</MenuItem>
                <MenuItem value="walking">{t('services.walking')}</MenuItem>
                <MenuItem value="sitting">{t('services.sitting')}</MenuItem>
                <MenuItem value="boarding">{t('services.boarding')}</MenuItem>
                <MenuItem value="grooming">{t('services.grooming')}</MenuItem>
                <MenuItem value="veterinary">{t('services.veterinary')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Location */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              placeholder={t('services.location')}
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
            />
          </Grid>

          {/* Budget Min */}
          <Grid size={{ xs: 6, md: 1 }}>
            <TextField
              fullWidth
              type="number"
              placeholder={t('services.budgetMin')}
              value={filters.budget_min || ''}
              onChange={(e) => handleFilterChange('budget_min', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Grid>

          {/* Budget Max */}
          <Grid size={{ xs: 6, md: 1 }}>
            <TextField
              fullWidth
              type="number"
              placeholder={t('services.budgetMax')}
              value={filters.budget_max || ''}
              onChange={(e) => handleFilterChange('budget_max', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Grid>

          {/* Urgent Only */}
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('services.urgency')}</InputLabel>
              <Select
                value={filters.is_urgent === undefined ? '' : filters.is_urgent}
                onChange={(e) => handleFilterChange('is_urgent', e.target.value === '' ? undefined : e.target.value === 'true')}
                label={t('services.urgency')}
              >
                <MenuItem value="">{t('services.all')}</MenuItem>
                <MenuItem value="true">{t('services.urgentOnly')}</MenuItem>
                <MenuItem value="false">{t('services.nonUrgentOnly')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>{t('common.loading')}</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !filteredRequests || filteredRequests.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? t('services.noMatchingRequests') : t('services.noRequestsFound')}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map(renderRequestCard)}
        </Grid>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/bookservice')}
      >
        <Add />
      </Fab>
    </Box>
  );
};
