import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Stack, Chip } from '@mui/material';
import { LocationOn, OpenInNew, Directions } from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';

interface LocationMessageProps {
  message: string;
  compact?: boolean;
}

export const LocationMessage: React.FC<LocationMessageProps> = ({ message, compact = false }) => {
  const { t } = useLocalization();
  const [mapError, setMapError] = useState(false);

  // Extract coordinates from message
  const latMatch = message.match(/Lat:\s*([0-9.-]+)/);
  const lngMatch = message.match(/Lng:\s*([0-9.-]+)/);
  
  const latitude = latMatch ? parseFloat(latMatch[1]) : null;
  const longitude = lngMatch ? parseFloat(lngMatch[1]) : null;

  const handleOpenInMaps = () => {
    if (latitude && longitude) {
      // Open in Google Maps
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleGetDirections = () => {
    if (latitude && longitude) {
      // Open Google Maps with directions
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(directionsUrl, '_blank');
    }
  };

  if (!latitude || !longitude) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <LocationOn color="error" />
        <Typography variant="body2" color="text.secondary">
          {t('chat.invalidLocation') || 'Invalid location data'}
        </Typography>
      </Box>
    );
  }

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mt: 1, 
        maxWidth: compact ? 250 : 300,
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.background.paper,
        borderColor: (theme) => theme.palette.error.main,
        borderWidth: 1,
        borderStyle: 'solid',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          {/* Location Header */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationOn color="error" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={600} color="error.main">
              {t('chat.sharedLocation') || 'Shared Location'}
            </Typography>
          </Stack>

          {/* Coordinates Display */}
          <Box sx={{ 
            backgroundColor: (theme) => theme.palette.action.hover,
            borderRadius: 1,
            p: 1.5,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('chat.coordinates') || 'Coordinates'}
            </Typography>
            <Typography variant="body2" fontFamily="monospace" color="text.primary">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Typography>
          </Box>

          {/* Map Preview (if not compact) */}
          {!compact && !mapError && (
            <Box sx={{ 
              height: 120,
              borderRadius: 1,
              overflow: 'hidden',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              backgroundColor: (theme) => theme.palette.action.hover,
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={handleOpenInMaps}
            >
              {/* Simple map placeholder - click to open in maps */}
              <Box sx={{
                width: '100%',
                height: '100%',
                backgroundColor: (theme) => theme.palette.action.hover,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}>
                <LocationOn sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Typography>
                <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 0.5 }}>
                  Click to open in maps
                </Typography>
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<OpenInNew />}
              onClick={handleOpenInMaps}
              sx={{ flex: 1 }}
            >
              {t('chat.openInMaps') || 'Open in Maps'}
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Directions />}
              onClick={handleGetDirections}
              sx={{ flex: 1 }}
            >
              {t('chat.directions') || 'Directions'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
