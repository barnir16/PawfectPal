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
import { useLocalization } from '../../contexts/LocalizationContext';
import { fetchDogBreedInfo, fetchCatBreedInfo, testBreedInfoAPI, checkExternalAPIAccessibility, type BreedInfo } from '../../services/external/externalApiService';

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
  const { t } = useLocalization();
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
          try {
            info = await fetchDogBreedInfo(normalizedBreedName);
            console.log('🐕 Dog breed info result:', info);
          } catch (apiError) {
            console.error('🐕 Dog breed API error:', apiError);
            // Fallback to basic info
            info = {
              name: normalizedBreedName,
              averageWeight: { min: 15, max: 35, unit: 'kg' as const },
              lifeExpectancy: { min: 10, max: 15, unit: 'years' as const },
              characteristics: {
                energyLevel: 'moderate' as const,
                groomingNeeds: 'moderate' as const,
                trainability: 'moderate' as const,
              },
              healthConsiderations: ['Regular veterinary checkups recommended'],
              exerciseNeeds: 'Daily exercise and mental stimulation needed',
              dietRecommendations: 'High-quality dog food appropriate for size and age',
              origin: 'Various origins',
              temperament: 'Loyal and friendly companion'
            };
          }
        } else if (normalizedPetType === 'cat') {
          console.log('🐱 Fetching cat breed info for:', normalizedBreedName);
          try {
            info = await fetchCatBreedInfo(normalizedBreedName);
            console.log('🐱 Cat breed info result:', info);
          } catch (apiError) {
            console.error('🐱 Cat breed API error:', apiError);
            // Fallback to basic info
            info = {
              name: normalizedBreedName,
              averageWeight: { min: 3, max: 6, unit: 'kg' as const },
              lifeExpectancy: { min: 12, max: 18, unit: 'years' as const },
              characteristics: {
                energyLevel: 'moderate' as const,
                groomingNeeds: 'moderate' as const,
                trainability: 'moderate' as const,
              },
              healthConsiderations: ['Regular veterinary checkups recommended'],
              exerciseNeeds: 'Playtime and environmental enrichment needed',
              dietRecommendations: 'High-quality cat food appropriate for age',
              origin: 'Various origins',
              temperament: 'Independent and affectionate companion'
            };
          }
        } else {
          console.log('❓ Unknown pet type:', normalizedPetType);
          setLoading(false);
          return;
        }
        
        console.log('📋 Breed info result:', info);
        setBreedInfo(info);
      } catch (err) {
        console.error('❌ Error fetching breed info:', err);
        setError(t('pets.failedToFetch'));
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
        <CardHeader title={t('pets.breedInfo')} />
        <CardContent>
          <Typography>{t('pets.loadingBreedInfo', { breed: breedName })}</Typography>
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
        <CardHeader title={t('pets.breedInfo')} />
        <CardContent>
          <Typography variant="h6" color="error">{t('pets.debugInfo')}:</Typography>
          <Typography>{t('pets.petType')}: {petType}</Typography>
          <Typography>{t('pets.breed')}: {breedName}</Typography>
          <Typography>{t('pets.normalizedPetType')}: {normalizedPetType}</Typography>
          <Typography>{t('pets.normalizedBreedName')}: {normalizedBreedName}</Typography>
          <Typography>{t('pets.error')}: {error || t('pets.noBreedInfoReturned')}</Typography>
          
          {/* Show basic breed info even when API fails */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('pets.breedInfo')}
            </Typography>
            <Typography variant="body2">
              <strong>{t('pets.type')}:</strong> {petType}
            </Typography>
            <Typography variant="body2">
              <strong>{t('pets.breed')}:</strong> {breedName}
            </Typography>
            {currentWeight && (
              <Typography variant="body2">
                <strong>{t('pets.currentWeight')}:</strong> {currentWeight} {weightUnit}
              </Typography>
            )}
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('pets.noDetailedBreedInfo', { breed: breedName })}.
          </Alert>
          
          {/* Test button to manually trigger API call */}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                console.log('🧪 Manual test of breed info API...');
                await testBreedInfoAPI();
              }}
              sx={{ mr: 1 }}
            >
              {t('pets.testBreedInfoAPI')}
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                const accessibility = await checkExternalAPIAccessibility();
                console.log('🌐 API Accessibility Check:', accessibility);
                alert(`Network: ${accessibility.network ? '✅' : '❌'}\nDog API: ${accessibility.dogAPI ? '✅' : '❌'}\nCat API: ${accessibility.catAPI ? '✅' : '❌'}`);
              }}
            >
              {t('pets.checkAPIAccessibility')}
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
            <Typography variant="h6">{t('pets.breedInfo')}</Typography>
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
                {t('pets.averageWeightRange')}
              </Typography>
              <Typography variant="body1">
                {breedInfo.averageWeight.min} - {breedInfo.averageWeight.max} {breedInfo.averageWeight.unit}
              </Typography>
            </Grid>
          )}
          
          {breedInfo.lifeExpectancy && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('pets.lifeExpectancy')}
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
              {t('pets.characteristics')}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {breedInfo.characteristics.energyLevel && (
                <Chip
                  icon={<FitnessIcon />}
                  label={`${t('pets.energy')}: ${t(`pets.energyLevel.${breedInfo.characteristics.energyLevel}`)}`}
                  size="small"
                  color={breedInfo.characteristics.energyLevel === 'high' ? 'error' : 'default'}
                />
              )}
              {breedInfo.characteristics.groomingNeeds && (
                <Chip
                  icon={<PetsIcon />}
                  label={`${t('pets.grooming')}: ${t(`pets.groomingNeeds.${breedInfo.characteristics.groomingNeeds}`)}`}
                  size="small"
                  color={breedInfo.characteristics.groomingNeeds === 'high' ? 'warning' : 'default'}
                />
              )}
              {breedInfo.characteristics.trainability && (
                <Chip
                  icon={<InfoIcon />}
                  label={`${t('pets.training')}: ${t(`pets.trainability.${breedInfo.characteristics.trainability}`)}`}
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
              {t('pets.healthConsiderations')}
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
                  {t('pets.exerciseNeeds')}
                </Typography>
                <Typography variant="body2">
                  {breedInfo.exerciseNeeds}
                </Typography>
              </Box>
            )}
            
            {breedInfo.dietRecommendations && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('pets.dietRecommendations')}
                </Typography>
                <Typography variant="body2">
                  {breedInfo.dietRecommendations}
                </Typography>
              </Box>
            )}
            
            {breedInfo.temperament && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('pets.temperament')}
                </Typography>
                <Typography variant="body2">
                  {breedInfo.temperament}
                </Typography>
              </Box>
            )}
            
            {breedInfo.origin && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('pets.origin')}
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
