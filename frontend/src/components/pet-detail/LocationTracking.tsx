import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  History as HistoryIcon,
  LocationOn as LocationIcon,
  Map as MapIcon,
  MyLocation as MyLocationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import {
  clearLocationWatch,
  createMapsUrl,
  getCurrentLocation,
  getPetLocationHistory,
  savePetLocation,
  watchLocation,
} from '../../services/location/locationService';
import type { Coordinates, LocationHistory } from '../../types/location';

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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);

  const activeLocation = useMemo(
    () => currentLocation ?? lastKnownLocation ?? null,
    [currentLocation, lastKnownLocation]
  );

  const persistLocation = useCallback(
    async (coordinates: Coordinates) => {
      const locationWithTimestamp = {
        ...coordinates,
        timestamp: coordinates.timestamp ?? Date.now(),
      };

      setCurrentLocation(locationWithTimestamp);
      onLocationUpdate?.(locationWithTimestamp);

      try {
        await savePetLocation(petId, locationWithTimestamp);
      } catch (persistError) {
        setError(
          persistError instanceof Error
            ? persistError.message
            : 'Failed to save location update'
        );
      }
    },
    [onLocationUpdate, petId]
  );

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const location = await getCurrentLocation();
      await persistLocation(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTracking = () => {
    if (isWatching) {
      clearLocationWatch();
      setIsWatching(false);
      onTrackingToggle?.(false);
      return;
    }

    setError(null);
    setIsWatching(true);
    onTrackingToggle?.(true);

    watchLocation(
      (coordinates) => {
        void persistLocation(coordinates);
      },
      (watchError) => {
        setError(watchError.message);
        setIsWatching(false);
        clearLocationWatch();
      }
    );
  };

  const handleOpenHistory = async () => {
    try {
      setHistoryLoading(true);
      setError(null);
      const history = await getPetLocationHistory(petId, 25);
      setLocationHistory(history);
      setHistoryOpen(true);
    } catch (historyError) {
      setError(
        historyError instanceof Error
          ? historyError.message
          : 'Failed to load location history'
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenInMaps = () => {
    if (!activeLocation) {
      return;
    }

    window.open(
      createMapsUrl(activeLocation, petName),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const formatCoordinates = (coords: Coordinates) =>
    `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const calculateDistance = (coords1: Coordinates, coords2: Coordinates) => {
    const r = 6371;
    const dLat = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
    const dLon = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords1.latitude * Math.PI) / 180) *
        Math.cos((coords2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (r * c).toFixed(2);
  };

  useEffect(() => {
    return () => {
      clearLocationWatch();
    };
  }, []);

  return (
    <>
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
                variant={isWatching || isTrackingEnabled ? 'contained' : 'outlined'}
                color={isWatching || isTrackingEnabled ? 'success' : 'primary'}
                startIcon={<MyLocationIcon />}
                onClick={handleToggleTracking}
                disabled={isLoading}
              >
                {isWatching || isTrackingEnabled
                  ? t('pets.stopTracking')
                  : t('pets.startTracking')}
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('pets.currentLocation')}
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">{t('pets.gettingLocation')}</Typography>
                </Box>
              ) : currentLocation ? (
                <Stack spacing={1}>
                  <Typography variant="body2" fontFamily="monospace">
                    {formatCoordinates(currentLocation)}
                  </Typography>
                  <Chip
                    label={t('pets.live')}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ width: 'fit-content' }}
                  />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('pets.noCurrentLocation')}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('pets.lastKnownLocation')}
              </Typography>
              {lastKnownLocation ? (
                <Stack spacing={0.5}>
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
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('pets.noLocationHistory')}
                </Typography>
              )}
            </Grid>
          </Grid>

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
              startIcon={historyLoading ? <CircularProgress size={16} /> : <HistoryIcon />}
              onClick={handleOpenHistory}
              disabled={historyLoading}
            >
              {t('pets.viewLocationHistory')}
            </Button>

            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={handleOpenInMaps}
              disabled={!activeLocation}
            >
              {t('pets.openInMaps')}
            </Button>
          </Box>

          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              {t('pets.trackingStatus')}: {isWatching || isTrackingEnabled ? t('pets.active') : t('pets.inactive')}
              {isWatching ? ` • ${t('pets.liveTracking')}` : ''}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{`${petName} - ${t('pets.viewLocationHistory')}`}</DialogTitle>
        <DialogContent dividers>
          {locationHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('pets.noLocationHistory')}
            </Typography>
          ) : (
            <List disablePadding>
              {locationHistory.map((entry, index) => (
                <ListItem
                  key={`${entry.pet_id}-${entry.timestamp}-${index}`}
                  divider={index < locationHistory.length - 1}
                  sx={{ px: 0 }}
                >
                  <ListItemText
                    primary={`${entry.latitude.toFixed(6)}, ${entry.longitude.toFixed(6)}`}
                    secondary={`${formatDate(entry.timestamp)}${entry.accuracy ? ` • ±${Math.round(entry.accuracy)}m` : ''}`}
                    primaryTypographyProps={{ fontFamily: 'monospace', variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LocationTracking;
