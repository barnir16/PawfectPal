import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  Alert,
  Skeleton,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Pets as PetsIcon,
  FitnessCenter as FitnessIcon,
  Restaurant as FoodIcon,
  HealthAndSafety as HealthIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { fetchDogBreedInfo, fetchCatBreedInfo, testBreedInfoAPI, type BreedInfo } from '../../services/external/externalApiService';

interface BreedInfoCardProps {
  petType: string;
  breedName: string;
  currentWeight?: number;
  weightUnit?: 'kg' | 'lb';
}

export const BreedInfoCard: React.FC<BreedInfoCardProps> = ({
  petType,
  breedName,
  currentWeight,
  weightUnit = 'kg'
}) => {
  const [breedInfo, setBreedInfo] = useState<BreedInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Normalize and validate props with better fallbacks
  const normalizedPetType = petType?.toLowerCase().trim() || 'unknown';
  const normalizedBreedName = breedName?.trim() || 'Unknown Breed';
  
  console.log('🔍 BreedInfoCard: Rendering with props:', { petType, breedName, currentWeight, weightUnit });
  console.log('🔍 Normalized values:', { normalizedPetType, normalizedBreedName });

  useEffect(() => {
    console.log('🔍 useEffect triggered with:', { normalizedPetType, normalizedBreedName });
    
    const fetchBreedInfo = async () => {
      try {
        console.log('🔍 Starting to fetch breed info for:', { normalizedPetType, normalizedBreedName });
        setLoading(true);
        setError(null);
        
        let info: BreedInfo | null = null;
        
        if (normalizedPetType === 'dog') {
          console.log('🐕 Fetching dog breed info for:', normalizedBreedName);
          info = await fetchDogBreedInfo(normalizedBreedName);
        } else if (normalizedPetType === 'cat') {
          console.log('🐱 Fetching cat breed info for:', normalizedBreedName);
          info = await fetchCatBreedInfo(normalizedBreedName);
        } else {
          console.log('❓ Unknown pet type:', normalizedPetType);
          setLoading(false);
          return;
        }
        
        console.log('📋 Breed info result:', info);
        setBreedInfo(info);
      } catch (err) {
        console.error('❌ Error fetching breed info:', err);
        setError('Failed to fetch breed information');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have valid data
    if (normalizedBreedName && normalizedBreedName !== 'Unknown Breed' && normalizedPetType !== 'unknown') {
      console.log('🔍 Proceeding with breed info fetch');
      fetchBreedInfo();
    } else {
      console.log('🔍 Skipping breed info fetch - insufficient data');
      setLoading(false);
    }
  }, [normalizedPetType, normalizedBreedName]);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getWeightStatus = () => {
    if (!breedInfo?.averageWeight || !currentWeight) return null;
    
    const { min, max, unit } = breedInfo.averageWeight;
    const normalizedCurrentWeight = weightUnit === 'lb' && unit === 'kg' 
      ? currentWeight * 0.453592 
      : unit === 'lb' && weightUnit === 'kg'
      ? currentWeight * 2.20462
      : currentWeight;
    
    if (normalizedCurrentWeight < min) {
      return { status: 'underweight', severity: 'warning' as const, message: 'Pet appears to be underweight for this breed' };
    } else if (normalizedCurrentWeight > max) {
      return { status: 'overweight', severity: 'warning' as const, message: 'Pet appears to be overweight for this breed' };
    } else {
      return { status: 'healthy', severity: 'success' as const, message: 'Pet weight is within healthy range for this breed' };
    }
  };

  const weightStatus = getWeightStatus();

  if (loading) {
    return (
      <Card>
        <CardHeader title="Breed Information" />
        <CardContent>
          <Typography>Loading breed information for {breedName}...</Typography>
          {/* Debug info during loading */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Debug Props:</Typography>
            <Typography variant="body2">Pet Type: {petType}</Typography>
            <Typography variant="body2">Breed Name: {breedName}</Typography>
            <Typography variant="body2">Current Weight: {currentWeight} {weightUnit}</Typography>
            <Typography variant="body2">Normalized Pet Type: {normalizedPetType}</Typography>
            <Typography variant="body2">Normalized Breed Name: {normalizedBreedName}</Typography>
          </Box>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  if (error || !breedInfo) {
    return (
      <Card>
        <CardHeader title="Breed Information" />
        <CardContent>
          <Typography variant="h6" color="error">Debug Info:</Typography>
          <Typography>Pet Type: {petType}</Typography>
          <Typography>Breed Name: {breedName}</Typography>
          <Typography>Normalized Pet Type: {normalizedPetType}</Typography>
          <Typography>Normalized Breed Name: {normalizedBreedName}</Typography>
          <Typography>Error: {error || 'No breed info returned'}</Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            No detailed breed information available for {breedName}.
          </Alert>
          {/* Test button to manually trigger API call */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                console.log('🧪 Manual test of breed info API...');
                await testBreedInfoAPI();
              }}
            >
              Test Breed Info API
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PetsIcon color="primary" />
            <Typography variant="h6">Breed Information</Typography>
          </Box>
        }
        action={
          <IconButton
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="show more"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      


      <CardContent>
        {/* Weight Status Alert */}
        {weightStatus && (
          <Alert severity={weightStatus.severity} sx={{ mb: 2 }}>
            {weightStatus.message}
          </Alert>
        )}

        {/* Basic Information */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {breedInfo.averageWeight && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Average Weight Range
              </Typography>
              <Typography variant="body1">
                {breedInfo.averageWeight.min} - {breedInfo.averageWeight.max} {breedInfo.averageWeight.unit}
              </Typography>
            </Grid>
          )}
          
          {breedInfo.lifeExpectancy && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Life Expectancy
              </Typography>
              <Typography variant="body1">
                {breedInfo.lifeExpectancy.min} - {breedInfo.lifeExpectancy.max} years
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Characteristics */}
        {breedInfo.characteristics && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Characteristics
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {breedInfo.characteristics.energyLevel && (
                <Chip
                  icon={<FitnessIcon />}
                  label={`Energy: ${breedInfo.characteristics.energyLevel}`}
                  size="small"
                  color={breedInfo.characteristics.energyLevel === 'high' ? 'error' : 'default'}
                />
              )}
              {breedInfo.characteristics.groomingNeeds && (
                <Chip
                  icon={<PetsIcon />}
                  label={`Grooming: ${breedInfo.characteristics.groomingNeeds}`}
                  size="small"
                  color={breedInfo.characteristics.groomingNeeds === 'high' ? 'warning' : 'default'}
                />
              )}
              {breedInfo.characteristics.trainability && (
                <Chip
                  icon={<InfoIcon />}
                  label={`Training: ${breedInfo.characteristics.trainability}`}
                  size="small"
                  color={breedInfo.characteristics.trainability === 'high' ? 'success' : 'default'}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Health Considerations */}
        {breedInfo.healthConsiderations && breedInfo.healthConsiderations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Health Considerations
            </Typography>
            <List dense>
              {breedInfo.healthConsiderations.map((consideration, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <HealthIcon color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={consideration} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Exercise and Diet */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            {breedInfo.exerciseNeeds && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Exercise Needs
                </Typography>
                <Typography variant="body2">
                  {breedInfo.exerciseNeeds}
                </Typography>
              </Box>
            )}
            
            {breedInfo.dietRecommendations && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Diet Recommendations
                </Typography>
                <Typography variant="body2">
                  {breedInfo.dietRecommendations}
                </Typography>
              </Box>
            )}
            
            {breedInfo.temperament && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Temperament
                </Typography>
                <Typography variant="body2">
                  {breedInfo.temperament}
                </Typography>
              </Box>
            )}
            
            {breedInfo.origin && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Origin
                </Typography>
                <Typography variant="body2">
                  {breedInfo.origin}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
