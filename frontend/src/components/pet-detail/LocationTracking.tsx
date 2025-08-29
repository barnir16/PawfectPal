import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  History as HistoryIcon,
  Map as MapIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { getCurrentLocation, watchLocation } from '../../services/location/locationService';
import type { Coordinates } from '../../types/location';

interface LocationTrackingProps {
  petId: number;
  petName: string;
  isTrackingEnabled: boolean;
  lastKnownLocation?: Coordinates;
  lastLocationUpdate?: string;
  onLocationUpdate?: (coordinates: Coordinates) => void;
  onTrackingToggle?: (enabled: boolean) => void;
}

export const LocationTracking: React.FC<LocationTrackingProps> = ({
  petId,
  petName,
  isTrackingEnabled,
  lastKnownLocation,
  lastLocationUpdate,
  onLocationUpdate,
  onTrackingToggle,
}) => {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Get current location
  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      if (onLocationUpdate) {
        onLocationUpdate(location);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  // Start/stop location watching
  const handleToggleTracking = () => {
    if (isWatching) {
      setIsWatching(false);
      if (onTrackingToggle) {
        onTrackingToggle(false);
      }
    } else {
      setIsWatching(true);
      if (onTrackingToggle) {
        onTrackingToggle(true);
      }
      // Start watching location
      watchLocation(
        (coordinates) => {
          setCurrentLocation(coordinates);
          if (onLocationUpdate) {
            onLocationUpdate(coordinates);
          }
        },
        (err) => {
          setError(err.message);
          setIsWatching(false);
        }
      );
    }
  };

  // Format coordinates for display
  const formatCoordinates = (coords: Coordinates) => {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate distance between two coordinates
  const calculateDistance = (coords1: Coordinates, coords2: Coordinates) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords1.latitude * Math.PI / 180) * Math.cos(coords2.latitude * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon color="primary" />
            <Typography variant="h6">{t('pets.locationTracking')}</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={t('pets.refreshLocation')}>
              <IconButton
                onClick={handleGetCurrentLocation}
                disabled={isLoading}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant={isTrackingEnabled ? "contained" : "outlined"}
              color={isTrackingEnabled ? "success" : "primary"}
              startIcon={<MyLocationIcon />}
              onClick={handleToggleTracking}
              disabled={isLoading}
            >
              {isTrackingEnabled ? t('pets.stopTracking') : t('pets.startTracking')}
            </Button>
          </Box>
        }
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Current Location */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('pets.currentLocation')}
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">{t('pets.gettingLocation')}</Typography>
              </Box>
            ) : currentLocation ? (
              <Box>
                <Typography variant="body2" fontFamily="monospace">
                  {formatCoordinates(currentLocation)}
                </Typography>
                <Chip
                  label={t('pets.live')}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('pets.noCurrentLocation')}
              </Typography>
            )}
          </Grid>

          {/* Last Known Location */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('pets.lastKnownLocation')}
            </Typography>
            {lastKnownLocation ? (
              <Box>
                <Typography variant="body2" fontFamily="monospace">
                  {formatCoordinates(lastKnownLocation)}
                </Typography>
                {lastLocationUpdate && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('pets.lastUpdate')}: {formatDate(lastLocationUpdate)}
                  </Typography>
                )}
                {currentLocation && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('pets.distance')}: {calculateDistance(currentLocation, lastKnownLocation)} km
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('pets.noLocationHistory')}
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<MyLocationIcon />}
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
          >
            {t('pets.getCurrentLocation')}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            disabled={!lastKnownLocation}
          >
            {t('pets.viewLocationHistory')}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<MapIcon />}
            disabled={!lastKnownLocation}
          >
            {t('pets.openInMaps')}
          </Button>
        </Box>

        {/* Status Information */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            {t('pets.trackingStatus')}: {isTrackingEnabled ? t('pets.active') : t('pets.inactive')}
            {isWatching && ' • ' + t('pets.liveTracking')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LocationTracking;

