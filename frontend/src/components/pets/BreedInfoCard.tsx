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

  // Simple debug logging
  console.log('🔍 BreedInfoCard rendered with props:', { petType, breedName, currentWeight, weightUnit });

  // Validate props
  if (!petType || !breedName) {
    console.warn('⚠️ BreedInfoCard: Invalid props:', { petType, breedName });
    return (
      <Card>
        <CardHeader title="Breed Information" />
        <CardContent>
          <Typography color="error">
            Invalid props: petType="{petType}", breedName="{breedName}"
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Simple test to see if component renders
  console.log('🔍 About to return JSX - final step');

  // Simple test to see if component renders
  console.log('🔍 About to return JSX - really final step');

  useEffect(() => {
    console.log('🔍 useEffect triggered with:', { petType, breedName });
    
    const fetchBreedInfo = async () => {
      try {
        console.log('🔍 Starting to fetch breed info for:', { petType, breedName });
        setLoading(true);
        setError(null);
        
        let info: BreedInfo | null = null;
        
        if (petType === 'dog') {
          console.log('🐕 Fetching dog breed info for:', breedName);
          info = await fetchDogBreedInfo(breedName);
        } else if (petType === 'cat') {
          console.log('🐱 Fetching cat breed info for:', breedName);
          info = await fetchCatBreedInfo(breedName);
        } else {
          console.log('❓ Unknown pet type:', petType);
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

    if (breedName && petType) {
      fetchBreedInfo();
    } else {
      setLoading(false);
    }
  }, [breedName, petType]);

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
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">Debug Props:</Typography>
            <Typography variant="body2">Pet Type: {petType}</Typography>
            <Typography variant="body2">Breed Name: {breedName}</Typography>
            <Typography variant="body2">Current Weight: {currentWeight} {weightUnit}</Typography>
          </Box>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="caption" color="primary">Status: LOADING</Typography>
            <Typography variant="body2">Attempting to fetch breed info...</Typography>
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
          <Typography>Error: {error || 'No breed info returned'}</Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            No detailed breed information available for {breedName}.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={`${breedName} Information`}
        action={
          <Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="show more"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            {/* Test button - remove after testing */}
            <IconButton
              size="small"
              onClick={async () => {
                console.log('🧪 Testing breed info API directly...');
                await testBreedInfoAPI();
              }}
              sx={{ ml: 1 }}
              color="secondary"
            >
              <WarningIcon />
            </IconButton>
            {/* Debug button - remove after testing */}
            <IconButton
              size="small"
              onClick={() => {
                console.log('🔍 Manual refresh triggered for:', { petType, breedName });
                setLoading(true);
                setError(null);
                // Force refresh
                const fetchBreedInfo = async () => {
                  try {
                    let info: BreedInfo | null = null;
                    if (petType === 'dog') {
                      console.log('🐕 Testing fetchDogBreedInfo with:', breedName);
                      info = await fetchDogBreedInfo(breedName);
                      console.log('🐕 Result:', info);
                    } else if (petType === 'cat') {
                      console.log('🐱 Testing fetchCatBreedInfo with:', breedName);
                      info = await fetchCatBreedInfo(breedName);
                      console.log('🐱 Result:', info);
                    }
                    console.log('🔍 Manual refresh result:', info);
                    setBreedInfo(info);
                  } catch (err) {
                    console.error('❌ Manual refresh error:', err);
                    setError('Failed to fetch breed information');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchBreedInfo();
              }}
              sx={{ ml: 1 }}
              color="primary"
            >
              <InfoIcon />
            </IconButton>
          </Box>
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
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Average Weight Range
              </Typography>
              <Typography variant="body1">
                {breedInfo.averageWeight.min} - {breedInfo.averageWeight.max} {breedInfo.averageWeight.unit}
              </Typography>
            </Grid>
          )}
          
          {breedInfo.lifeExpectancy && (
            <Grid item xs={12} sm={6}>
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
              {breedInfo.characteristics.goodWithChildren !== undefined && (
                <Chip
                  label={breedInfo.characteristics.goodWithChildren ? 'Good with kids' : 'Not kid-friendly'}
                  size="small"
                  color={breedInfo.characteristics.goodWithChildren ? 'success' : 'warning'}
                />
              )}
              {breedInfo.characteristics.goodWithOtherPets !== undefined && (
                <Chip
                  label={breedInfo.characteristics.goodWithOtherPets ? 'Pet-friendly' : 'Not pet-friendly'}
                  size="small"
                  color={breedInfo.characteristics.goodWithOtherPets ? 'success' : 'warning'}
                />
              )}
            </Box>
          </Box>
        )}

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* Health Considerations */}
          {breedInfo.healthConsiderations && breedInfo.healthConsiderations.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                <HealthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Health Considerations
              </Typography>
              <List dense>
                {breedInfo.healthConsiderations.map((consideration, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={consideration} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Exercise Needs */}
          {breedInfo.exerciseNeeds && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                <FitnessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Exercise Needs
              </Typography>
              <Typography variant="body2">
                {breedInfo.exerciseNeeds}
              </Typography>
            </Box>
          )}

          {/* Diet Recommendations */}
          {breedInfo.dietRecommendations && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                <FoodIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Diet Recommendations
              </Typography>
              <Typography variant="body2">
                {breedInfo.dietRecommendations}
              </Typography>
            </Box>
          )}

          {/* Origin and Temperament */}
          <Grid container spacing={2}>
            {breedInfo.origin && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Origin
                </Typography>
                <Typography variant="body2">
                  {breedInfo.origin}
                </Typography>
              </Grid>
            )}
            
            {breedInfo.temperament && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Temperament
                </Typography>
                <Typography variant="body2">
                  {breedInfo.temperament}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};
