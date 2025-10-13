import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Analytics as AnalyticsIcon,
  Pets as PetsIcon,
  Scale as ScaleIcon,
  Vaccines as VaccinesIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { getPets } from '../../services/pets/petService';
import { WeightService } from '../../services/weight/weightService';
import { VaccineTaskService } from '../../services/tasks/vaccineTaskService';
import type { Pet } from '../../types/pets/pet';

interface HealthPrediction {
  petId: number;
  petName: string;
  healthScore: number;
  riskFactors: string[];
  recommendations: string[];
  nextCheckup: string;
  weightTrend: 'increasing' | 'decreasing' | 'stable';
  vaccinationStatus: 'up_to_date' | 'due_soon' | 'overdue';
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

interface HealthInsight {
  type: 'weight' | 'vaccination' | 'behavior' | 'nutrition';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
  timeframe: string;
}

export const HealthPredictor: React.FC = () => {
  const { t } = useLocalization();
  const [pets, setPets] = useState<Pet[]>([]);
  const [predictions, setPredictions] = useState<HealthPrediction[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      
      const petsData = await getPets();
      setPets(petsData);
      
      // Generate health predictions for each pet
      const healthPredictions = await Promise.all(
        petsData.map(pet => generateHealthPrediction(pet))
      );
      setPredictions(healthPredictions);
      
      // Generate overall insights
      const healthInsights = generateHealthInsights(healthPredictions);
      setInsights(healthInsights);
      
    } catch (err) {
      console.error('Error loading health data:', err);
      setError('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const generateHealthPrediction = async (pet: Pet): Promise<HealthPrediction> => {
    try {
      // Get weight records
      const weightRecords = await WeightService.getWeightRecords(pet.id || 0);
      
      // Get vaccination tasks
      const vaccineTasks = await VaccineTaskService.getVaccineTasks(pet.id || 0);
      
      // Calculate health score (0-100)
      let healthScore = 100;
      const riskFactors: string[] = [];
      const recommendations: string[] = [];
      
      // Weight analysis
      if (weightRecords.length > 0) {
        const recentWeight = weightRecords[weightRecords.length - 1];
        const weightTrend = calculateWeightTrend(weightRecords);
        
        if (weightTrend === 'increasing' && recentWeight.weight > (pet.weightKg || 0) * 1.1) {
          healthScore -= 15;
          riskFactors.push('עלייה במשקל');
          recommendations.push('התייעץ עם וטרינר לגבי תזונה');
        } else if (weightTrend === 'decreasing' && recentWeight.weight < (pet.weightKg || 0) * 0.9) {
          healthScore -= 20;
          riskFactors.push('ירידה במשקל');
          recommendations.push('בדוק את התזונה והתייעץ עם וטרינר');
        }
      }
      
      // Vaccination analysis
      const overdueVaccines = vaccineTasks.filter(task => 
        !task.isCompleted && new Date(task.dateTime) < new Date()
      );
      const dueSoonVaccines = vaccineTasks.filter(task => 
        !task.isCompleted && new Date(task.dateTime) > new Date() && 
        new Date(task.dateTime) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
      
      if (overdueVaccines.length > 0) {
        healthScore -= 25;
        riskFactors.push('חיסונים באיחור');
        recommendations.push('קבע תור וטרינר לחיסונים דחופים');
      } else if (dueSoonVaccines.length > 0) {
        healthScore -= 10;
        riskFactors.push('חיסונים מתקרבים');
        recommendations.push('תזכר לקבע תור לחיסונים');
      }
      
      // Age-based recommendations
      const petAge = calculatePetAge(pet.birthDate);
      if (petAge > 7) {
        recommendations.push('בדיקות בריאות תקופתיות מומלצות');
      }
      
      // Determine overall health
      let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
      if (healthScore >= 90) overallHealth = 'excellent';
      else if (healthScore >= 75) overallHealth = 'good';
      else if (healthScore >= 60) overallHealth = 'fair';
      else overallHealth = 'poor';
      
      return {
        petId: pet.id || 0,
        petName: pet.name,
        healthScore: Math.max(0, healthScore),
        riskFactors,
        recommendations,
        nextCheckup: calculateNextCheckup(pet, vaccineTasks),
        weightTrend: calculateWeightTrend(weightRecords),
        vaccinationStatus: overdueVaccines.length > 0 ? 'overdue' : 
                         dueSoonVaccines.length > 0 ? 'due_soon' : 'up_to_date',
        overallHealth,
      };
    } catch (err) {
      console.error('Error generating prediction for pet:', pet.name, err);
      return {
        petId: pet.id || 0,
        petName: pet.name,
        healthScore: 50,
        riskFactors: ['נתונים לא זמינים'],
        recommendations: ['הוסף נתוני משקל וחיסונים לקבלת תובנות מדויקות יותר'],
        nextCheckup: 'לא נקבע',
        weightTrend: 'stable',
        vaccinationStatus: 'up_to_date',
        overallHealth: 'fair',
      };
    }
  };

  const calculateWeightTrend = (weightRecords: any[]): 'increasing' | 'decreasing' | 'stable' => {
    if (weightRecords.length < 2) return 'stable';
    
    const recent = weightRecords.slice(-3);
    const first = recent[0].weight;
    const last = recent[recent.length - 1].weight;
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  };

  const calculatePetAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const calculateNextCheckup = (pet: Pet, vaccineTasks: any[]): string => {
    const dueVaccines = vaccineTasks.filter(task => 
      !task.completed && new Date(task.dueDate) > new Date()
    );
    
    if (dueVaccines.length > 0) {
      const nextVaccine = dueVaccines.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )[0];
      return new Date(nextVaccine.dueDate).toLocaleDateString();
    }
    
    // Default to 6 months from now
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return sixMonthsFromNow.toLocaleDateString();
  };

  const generateHealthInsights = (predictions: HealthPrediction[]): HealthInsight[] => {
    const insights: HealthInsight[] = [];
    
    // Weight insights
    const weightIssues = predictions.filter(p => p.weightTrend !== 'stable');
    if (weightIssues.length > 0) {
      insights.push({
        type: 'weight',
        severity: weightIssues.length > 2 ? 'high' : 'medium',
        title: 'שינויים במשקל',
        description: `${weightIssues.length} חיות מחמד מראות שינויים במשקל`,
        action: 'בדוק תזונה ופעילות גופנית',
        timeframe: 'שבוע',
      });
    }
    
    // Vaccination insights
    const vaccinationIssues = predictions.filter(p => p.vaccinationStatus !== 'up_to_date');
    if (vaccinationIssues.length > 0) {
      insights.push({
        type: 'vaccination',
        severity: vaccinationIssues.filter(p => p.vaccinationStatus === 'overdue').length > 0 ? 'high' : 'medium',
        title: 'חיסונים נדרשים',
        description: `${vaccinationIssues.length} חיות מחמד דורשות חיסונים`,
        action: 'קבע תור וטרינר',
        timeframe: 'שבוע',
      });
    }
    
    // Overall health insights
    const poorHealth = predictions.filter(p => p.overallHealth === 'poor');
    if (poorHealth.length > 0) {
      insights.push({
        type: 'behavior',
        severity: 'high',
        title: 'בריאות ירודה',
        description: `${poorHealth.length} חיות מחמד דורשות תשומת לב מיידית`,
        action: 'פנה לווטרינר בהקדם',
        timeframe: 'מיד',
      });
    }
    
    return insights;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircleIcon color="success" />;
      case 'good': return <HealthIcon color="info" />;
      case 'fair': return <WarningIcon color="warning" />;
      case 'poor': return <WarningIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  const handlePetDetail = (pet: Pet) => {
    setSelectedPet(pet);
    setDetailDialogOpen(true);
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
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AnalyticsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          ניתוח בריאות מתקדם
        </Typography>
      </Box>

      {/* Health Insights */}
      {insights.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            תובנות בריאות
          </Typography>
          <Grid container spacing={2}>
            {insights.map((insight, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                <Alert 
                  severity={insight.severity === 'high' ? 'error' : 
                           insight.severity === 'medium' ? 'warning' : 'info'}
                  icon={insight.type === 'weight' ? <ScaleIcon /> :
                        insight.type === 'vaccination' ? <VaccinesIcon /> :
                        <HealthIcon />}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {insight.title}
                  </Typography>
                  <Typography variant="body2">
                    {insight.description}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    <strong>פעולה:</strong> {insight.action} • <strong>זמן:</strong> {insight.timeframe}
                  </Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Pet Health Predictions */}
      <Grid container spacing={3}>
        {predictions.map((prediction) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={prediction.petId}>
            <Card>
              <CardHeader
                avatar={getHealthIcon(prediction.overallHealth)}
                title={prediction.petName}
                subheader={`ציון בריאות: ${prediction.healthScore}/100`}
                action={
                  <Button
                    size="small"
                    onClick={() => handlePetDetail(pets.find(p => p.id === prediction.petId)!)}
                  >
                    פרטים
                  </Button>
                }
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    ציון בריאות
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={prediction.healthScore}
                    color={getHealthColor(prediction.healthScore) as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {prediction.riskFactors.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      גורמי סיכון
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {prediction.riskFactors.map((factor, index) => (
                        <Chip
                          key={index}
                          label={factor}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    סטטוס חיסונים
                  </Typography>
                  <Chip
                    label={
                      prediction.vaccinationStatus === 'up_to_date' ? 'מעודכן' :
                      prediction.vaccinationStatus === 'due_soon' ? 'מתקרב' : 'באיחור'
                    }
                    color={
                      prediction.vaccinationStatus === 'up_to_date' ? 'success' :
                      prediction.vaccinationStatus === 'due_soon' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    בדיקה הבאה
                  </Typography>
                  <Typography variant="body2">
                    {prediction.nextCheckup}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pet Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ניתוח בריאות מפורט - {selectedPet?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPet && (
            <Box>
              <Typography variant="h6" gutterBottom>
                המלצות
              </Typography>
              <List>
                {predictions
                  .find(p => p.petId === selectedPet.id)
                  ?.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthPredictor;

