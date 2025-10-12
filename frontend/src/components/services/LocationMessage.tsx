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
          {!compact && (
            <Box sx={{ 
              height: 120,
              borderRadius: 1,
              overflow: 'hidden',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              backgroundColor: (theme) => theme.palette.action.hover,
              position: 'relative',
              cursor: 'pointer',
              background: `linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)`,
            }}
            onClick={handleOpenInMaps}
            >
              {/* Enhanced map preview */}
              <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                position: 'relative',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                }
              }}>
                {/* Map-like grid pattern */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                  opacity: 0.3,
                }} />
                
                {/* Location pin */}
                <LocationOn sx={{ 
                  fontSize: 48, 
                  color: 'error.main', 
                  mb: 1,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  zIndex: 1,
                }} />
                
                {/* Coordinates */}
                <Typography 
                  variant="body2" 
                  color="text.primary" 
                  textAlign="center"
                  sx={{ 
                    fontWeight: 600,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    zIndex: 1,
                  }}
                >
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Typography>
                
                {/* Click hint */}
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  textAlign="center" 
                  sx={{ 
                    mt: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.5,
                    zIndex: 1,
                  }}
                >
                  {t('chat.openInMaps') || 'Click to open in maps'}
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
