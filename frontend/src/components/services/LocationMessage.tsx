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

  // Extract coordinates from message - handle multiple formats
  const latMatch = message.match(/Lat:\s*([0-9.-]+)|latitude[:\s]*([0-9.-]+)|lat[:\s]*([0-9.-]+)/i);
  const lngMatch = message.match(/Lng:\s*([0-9.-]+)|longitude[:\s]*([0-9.-]+)|lng[:\s]*([0-9.-]+)|lon[:\s]*([0-9.-]+)/i);
  
  const latitude = latMatch ? parseFloat(latMatch[1] || latMatch[2] || latMatch[3]) : null;
  const longitude = lngMatch ? parseFloat(lngMatch[1] || lngMatch[2] || lngMatch[3] || lngMatch[4]) : null;

  console.log('📍 LocationMessage parsing:', {
    message,
    latMatch,
    lngMatch,
    latitude,
    longitude,
    hasCoordinates: !!(latitude && longitude),
    willRender: !!(latitude && longitude)
  });

  if (!latitude || !longitude) {
    console.log('📍 LocationMessage: No valid coordinates found, returning invalid location message');
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <LocationOn color="error" />
        <Typography variant="body2" color="text.secondary">
          {t('chat.invalidLocation') || 'Invalid location data'}
        </Typography>
      </Box>
    );
  }

  console.log('📍 LocationMessage: Valid coordinates found, rendering location preview');

  // Get Google Maps API key from environment or use a fallback
  const getGoogleMapsApiKey = () => {
    // Try to get from environment variable first
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) return apiKey;
    
    // Fallback to a public key (may have usage limits)
    return 'AIzaSyBFw0Qbyq9zTFTd-tUY6dOWWgU6xVqjJkY';
  };

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
          {!compact && (
            <Box sx={{ 
              height: 120,
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: '#f5f5f5',
              position: 'relative',
              backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=300x120&markers=color:red%7C${latitude},${longitude}&key=${getGoogleMapsApiKey()})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}>
              {/* Fallback if map fails to load */}
              {mapError && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  color: 'text.secondary',
                }}>
                  <Stack alignItems="center" spacing={1}>
                    <LocationOn sx={{ fontSize: 32 }} />
                    <Typography variant="caption">
                      {t('chat.mapPreview') || 'Map Preview'}
                    </Typography>
                  </Stack>
                </Box>
              )}
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
