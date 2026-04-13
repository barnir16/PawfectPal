import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress,
  Avatar,
  Stack,
  Badge,
  Chip,
  InputLabelProps
} from '@mui/material';
import {
  Pets as PetsIcon,
  Scale as ScaleIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Favorite as HeartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { useTheme } from '@mui/material/styles';
import { getPets } from '../../../services/pets/petService';

import { WeightService } from '../../../services/weight/weightService';
import WeightGoalService, { WeightGoal } from '../../../services/weight/weightGoalService';
import { WeightRecord } from '../../../services/weight/weightMonitoringService';

interface WeightGoalUpdate {
  id?: number;
  pet_id: number;
  target_weight: number;
  weight_unit: 'kg' | 'lbs';
  goal_type: 'custom' | 'external_api' | 'vet_recommended';
  description: string;
  target_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LocalWeightRecord {
  id?: number;
  petId: number;
  date: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  notes?: string;
  source: 'manual' | 'vet' | 'auto';
  petName?: string;
  created_at?: string;
  updated_at?: string;
}

export const WeightTrackingPage = () => {
  const { t } = useLocalization();
  const theme = useTheme();
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [weightData, setWeightData] = useState<LocalWeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addWeightDialogOpen, setAddWeightDialogOpen] = useState(false);
  const [addWeightGoalDialogOpen, setAddWeightGoalDialogOpen] = useState(false);
  const [editWeightDialogOpen, setEditWeightDialogOpen] = useState(false);
  const [editWeightGoalDialogOpen, setEditWeightGoalDialogOpen] = useState(false);
  const [weightGoals, setWeightGoals] = useState<WeightGoal[]>([]);
  const [editWeightRecord, setEditWeightRecord] = useState<WeightRecord | null>(null);
  const [editWeightGoal, setEditWeightGoal] = useState<WeightGoalUpdate | null>(null);

  const [newWeightRecord, setNewWeightRecord] = useState({
    petId: '',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [newWeightGoal, setNewWeightGoal] = useState({
    petId: '',
    targetWeight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    goalType: 'custom' as 'custom' | 'external_api' | 'vet_recommended',
    description: '',
    targetDate: '',
    isActive: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const petsData = await getPets();
      setPets(petsData);

      // Try to get real weight data from the service
      let realWeightData: WeightRecord[] = [];

      try {
        realWeightData = await WeightService.getAllWeightRecords();
        console.log('📊 Loaded weight records:', realWeightData.length);
      } catch (error) {
        console.log('No real weight data available, will show empty chart');
      }

      // Ensure all weight records have pet names and convert to LocalWeightRecord format
      const localWeightData: LocalWeightRecord[] = realWeightData.map(record => ({
        ...record,
        date: typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0],
        petName: record.petName || petsData.find(p => p.id === record.petId)?.name || `Pet ${record.petId}`
      }));

      // Add current weights from pets if they exist and no weight records
      if (realWeightData.length === 0) {
        petsData.forEach(pet => {
          if (pet.weightKg) {
            realWeightData.push({
              date: new Date(new Date().toISOString().split('T')[0]),
              weight: pet.weightKg,
              petId: pet.id || 0,
              petName: pet.name,
              weightUnit: pet.weightUnit === 'lb' ? 'lbs' : pet.weightUnit || 'kg',
              source: 'manual'
            });
          }
        });
      }

      setWeightData(localWeightData);

      // Load weight goals
      try {
        const goals = await WeightGoalService.getAllWeightGoals();
        setWeightGoals(goals);
        console.log('🎯 Loaded weight goals:', goals.length);
      } catch (error) {
        console.log('No weight goals available');
      }
    } catch (err) {
      console.error('Error loading weight data:', err);
      setError('Failed to load weight data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWeightRecord = async () => {
    if (!newWeightRecord.petId || !newWeightRecord.weight) return;

    console.log('🚀 Adding weight record:', {
      petId: newWeightRecord.petId,
      weight: newWeightRecord.weight,
      weightUnit: newWeightRecord.weightUnit,
      date: newWeightRecord.date,
      notes: newWeightRecord.notes,
      source: 'manual'
    });

    try {
      const record = await WeightService.createWeightRecord({
        petId: parseInt(newWeightRecord.petId),
        weight: parseFloat(newWeightRecord.weight),
        weightUnit: newWeightRecord.weightUnit,
        date: newWeightRecord.date,
        notes: newWeightRecord.notes || undefined,
        source: 'manual'
      });

      console.log('✅ Create response:', record);

      if (record) {
        console.log('💾 Adding to local state:', {
          date: record.date.toISOString().split('T')[0],
          weight: record.weight,
          petId: record.petId,
          petName: pets.find(p => p.id === record.petId)?.name || 'Unknown Pet',
          notes: record.notes
        });

        // Add the new record to the local state
        setWeightData(prev => [...prev, {
          date: record.date.toISOString().split('T')[0],
          weight: record.weight,
          petId: record.petId,
          petName: pets.find(p => p.id === record.petId)?.name || 'Unknown Pet',
          notes: record.notes,
          weightUnit: record.weightUnit as 'kg' | 'lbs',
          source: record.source as 'manual' | 'vet' | 'auto'
        }]);

        // Reset form and close dialog
        setNewWeightRecord({
          petId: '',
          weight: '',
          weightUnit: 'kg',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setAddWeightDialogOpen(false);
      }
    } catch (error) {
      console.error('❌ Error adding weight record:', error);
      console.log('Failed to add weight record. Please try again later.');
    }
  };

  const handleAddWeightGoal = async () => {
    if (!newWeightGoal.petId || !newWeightGoal.targetWeight) return;

    try {
      const goal = await WeightGoalService.createWeightGoal({
        pet_id: parseInt(newWeightGoal.petId),
        target_weight: parseFloat(newWeightGoal.targetWeight),
        weight_unit: newWeightGoal.weightUnit,
        goal_type: newWeightGoal.goalType,
        description: newWeightGoal.description || undefined,
        is_active: newWeightGoal.isActive,
        target_date: newWeightGoal.targetDate || undefined
      });

      if (goal) {
        // Add the new goal to the local state
        setWeightGoals(prev => [...prev, goal]);

        // Reset form and close dialog
        setNewWeightGoal({
          petId: '',
          targetWeight: '',
          weightUnit: 'kg',
          goalType: 'custom',
          description: '',
          targetDate: '',
          isActive: true
        });
        setAddWeightGoalDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding weight goal:', error);
      console.log('Failed to add weight goal. Please try again later.');
    }
  };

  const handleEditWeightRecord = (record: LocalWeightRecord) => {
    // Handle both string and Date objects for the date field
    const dateValue = typeof record.date === 'string' 
      ? record.date.split('T')[0] 
      : record.date && typeof record.date === 'object' && 'toISOString' in record.date
        ? record.date.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
        
    setEditWeightRecord({
      ...record,
      date: new Date(dateValue),
      id: record.id || 0,
      weightUnit: record.weightUnit,
      source: record.source,
      pet_id: record.petId,
      weight_unit: record.weightUnit
    });
    setEditWeightDialogOpen(true);
  };

  const handleEditWeightGoal = (goal: WeightGoal) => {
    setEditWeightGoal({
      id: goal.id,
      pet_id: goal.pet_id,
      target_weight: goal.target_weight,
      weight_unit: goal.weight_unit as 'kg' | 'lbs',
      goal_type: goal.goal_type as 'custom' | 'external_api' | 'vet_recommended',
      description: goal.description || '',
      target_date: goal.target_date.split('T')[0],
      is_active: goal.is_active
    });
    setEditWeightGoalDialogOpen(true);
  };

  const handleUpdateWeightRecord = async () => {
    if (!editWeightRecord) return;

    console.log('🚀 Updating weight record:', {
      id: editWeightRecord.id,
      petId: editWeightRecord.petId,
      weight: editWeightRecord.weight,
      weightUnit: editWeightRecord.weightUnit,
      date: editWeightRecord.date,
      notes: editWeightRecord.notes,
      source: 'manual'
    });

    try {
      const updatedRecord = {
        petId: editWeightRecord.petId,
        weight: Number(editWeightRecord.weight),
        weightUnit: editWeightRecord.weightUnit,
        date: new Date(editWeightRecord.date).toISOString(),
        notes: editWeightRecord.notes || undefined,
        source: 'manual' as const
      };

      console.log('📤 Sending update request:', updatedRecord);

      if (editWeightRecord.id) {
        const result = await WeightService.updateWeightRecord(editWeightRecord.id, updatedRecord);
        console.log('📥 Update result:', result);
      } else {
        console.log('📥 Adding new record (no ID):', updatedRecord);
      }

      setEditWeightDialogOpen(false);
      setEditWeightRecord(null);
      loadData();
    } catch (error) {
      console.error('❌ Error updating weight record:', error);
      setError(t('weight.updateError'));
    }
  };

  const handleUpdateWeightGoal = async () => {
    if (!editWeightGoal) return;

    try {
      const goalData = {
        pet_id: Number(editWeightGoal.pet_id),
        target_weight: Number(editWeightGoal.target_weight),
        weight_unit: editWeightGoal.weight_unit,
        goal_type: editWeightGoal.goal_type,
        description: editWeightGoal.description,
        target_date: new Date(editWeightGoal.target_date).toISOString(),
        is_active: editWeightGoal.is_active
      };

      if (editWeightGoal.id) {
        await WeightGoalService.updateWeightGoal(editWeightGoal.id, goalData);
      } else {
        await WeightGoalService.createWeightGoal(goalData);
      }

      setEditWeightGoalDialogOpen(false);
      setEditWeightGoal(null);
      loadData();
    } catch (error) {
      console.error('Error updating weight goal:', error);
      setError(t('weight.goalUpdateError'));
    }
  };

  const filteredData = selectedPet === 'all'
    ? weightData
    : weightData.filter(record => record.petId.toString() === selectedPet);

  // Process chart data properly
  const chartData = filteredData.reduce((acc: any[], record) => {
    // Get pet name from pets array if not available in record
    const petName = record.petName || pets.find(p => p.id === record.petId)?.name || `Pet ${record.petId}`;

    // Convert date to string for chart display
    const dateString = typeof record.date === 'string' ? record.date : record.date && typeof record.date === 'object' && 'toISOString' in record.date ? record.date.toISOString().split('T')[0] : record.date;

    const existingDate = acc.find(item => item.date === dateString);
    if (existingDate) {
      existingDate[petName] = record.weight;
    } else {
      const newDate: any = { date: dateString };
      newDate[petName] = record.weight;
      acc.push(newDate);
    }
    return acc;
  }, []);

  // Sort chart data by date
  chartData.sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
    return dateA.getTime() - dateB.getTime();
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Typography>Loading weight data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Enhanced Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {t('weight.weightTracking')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('weight.trackAllPets')} - {t('weight.monitorWeightTrends')}
        </Typography>
      </Box>

      {/* Enhanced Pet Selection Section */}
      <Paper sx={{ p: 4, mb: 3, bgcolor: 'background.paper' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {t('weight.trackAllPets')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('weight.monitorWeightTrends')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>{t('weight.selectPet')}</InputLabel>
              <Select
                value={selectedPet}
                label={t('weight.selectPet')}
                onChange={(e) => setSelectedPet(e.target.value)}
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PetsIcon fontSize="small" />
                    {t('weight.allPets')}
                  </Box>
                </MenuItem>
                {pets.map((pet) => (
                  <MenuItem key={pet.id} value={pet.id?.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        {pet.name.charAt(0).toUpperCase()}
                      </Avatar>
                      {pet.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced Weight Chart Section */}
      <Paper sx={{ p: 4, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <TrendingUpIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {t('weight.weightChart')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visualize your pets' weight trends over time
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddWeightDialogOpen(true)}
              sx={{
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {t('weight.addWeightRecord')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FlagIcon />}
              onClick={() => setAddWeightGoalDialogOpen(true)}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.light'
                }
              }}
            >
              {t('weight.addWeightGoal')}
            </Button>
          </Box>
        </Box>

        {chartData.length > 0 ? (
          <Box sx={{
            p: 3,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis
                  label={{ value: t('weight.weight') + ' (' + t('pets.kg') + ')', angle: -90, position: 'insideLeft' }}
                  stroke="#666"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: theme.shadows[4]
                  }}
                />
                <Legend />
                {pets.map((pet) => (
                  <Line
                    key={pet.id}
                    type="monotone"
                    dataKey={pet.name}
                    stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
                    strokeWidth={3}
                    dot={{ r: 5, fill: `hsl(${Math.random() * 360}, 70%, 50%)` }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'grey.300'
          }}>
            <TrendingUpIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
              {t('weight.noDataAvailable')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Start tracking your pets' weight to see trends and patterns
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddWeightDialogOpen(true)}
            >
              {t('weight.addWeightRecord')}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Enhanced Current Weights Section */}
      <Paper sx={{ p: 4, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <ScaleIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {t('weight.currentWeights')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('weight.monitorWeightTrends')}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            size="small"
          >
            {t('weight.refresh')}
          </Button>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Grid container spacing={3} component="div">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {pets.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('weight.totalPets')}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {pets.filter(p => p.weightKg).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('weight.withWeightData')}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {pets.filter(p => p.weightKg).length > 0
                    ? (pets.filter(p => p.weightKg).reduce((sum, p) => sum + (p.weightKg || 0), 0) / pets.filter(p => p.weightKg).length).toFixed(1)
                    : '0'} {t('pets.kg')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('weight.averageWeight')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {pets.map((pet) => {
            const currentWeight = pet.weightKg || 0;
            const weightUnit = pet.weightUnit || 'kg';

            // Find weight goals for this pet
            const petGoals = weightGoals.filter(goal => goal.pet_id === pet.id && goal.is_active);
            const hasActiveGoal = petGoals.length > 0;
            const currentGoal = hasActiveGoal ? petGoals[0] : null;
            const goalProgress = currentGoal ? Math.min((currentWeight / currentGoal.target_weight) * 100, 100) : 0;
            const isGoalAchieved = currentGoal ? currentWeight >= currentGoal.target_weight : false;

            // Calculate age using the same logic as other components
            const calculateAge = () => {
              const birthDate = pet.birthDate || pet.birth_date;
              if (birthDate && (pet.isBirthdayGiven || pet.is_birthday_given)) {
                try {
                  let birth;
                  if (typeof birthDate === 'string' && birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = birthDate.split('-').map(Number);
                    birth = new Date(year, month - 1, day);
                  } else {
                    birth = new Date(birthDate);
                  }

                  if (isNaN(birth.getTime())) {
                    return t('pets.unknownAge');
                  }

                  const now = new Date();
                  const ageInMilliseconds = now.getTime() - birth.getTime();
                  const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
                  const ageInMonths = Math.floor(ageInDays / 30.44);
                  const ageInYears = Math.floor(ageInDays / 365.25);

                  if (ageInDays < 0) {
                    return t('pets.futureBirthdate');
                  }

                  if (ageInYears < 1) {
                    const months = Math.max(0, ageInMonths);
                    return `${months} ${t('pets.months')}`;
                  }
                  return `${ageInYears} ${t('pets.years')}`;
                } catch (error) {
                  console.log('Error calculating age from birthdate:', birthDate, error);
                  return t('pets.unknownAge');
                }
              }

              // Fallback to age field if no birthdate
              if (pet.age !== undefined && pet.age !== null) {
                if (pet.age < 1) {
                  const months = Math.floor(pet.age * 12);
                  return `${months} ${t('pets.months')}`;
                }
                return `${pet.age} ${t('pets.years')}`;
              }

              return t('pets.unknownAge');
            };

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={pet.id}>
                <Card
                  sx={{
                    background: isGoalAchieved
                      ? 'success.light'
                      : 'background.paper',
                    border: `2px solid ${isGoalAchieved ? 'success.main' : 'grey.200'}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{
                        bgcolor: isGoalAchieved ? 'success.main' : 'primary.main',
                        width: 40,
                        height: 40
                      }}>
                        <PetsIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {pet.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pet.breed || pet.breedType || t('pets.notSpecified')}
                        </Typography>
                      </Box>
                      {hasActiveGoal && (
                        <Badge color="success" variant="dot" />
                      )}
                    </Box>

                    {/* Current Weight Display */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
                        {currentWeight} {weightUnit === 'kg' ? t('pets.kg') : t('pets.pounds')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        {t('pets.age')}: {calculateAge()}
                      </Typography>
                      
                    </Box>

                    {/* Goal Progress (if exists) */}
                    {hasActiveGoal && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('weight.progress')} - {currentGoal?.goal_type}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {goalProgress.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={goalProgress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: isGoalAchieved ? 'success.main' : 'primary.main'
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('weight.currentWeight')}: {currentWeight} {currentGoal?.weight_unit}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('weight.targetWeight')}: {currentGoal?.target_weight} {currentGoal?.weight_unit}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Show notes from the most recent weight record if available */}
                    {weightData
                      .filter(record => record.petId === pet.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.notes && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t('weight.notes')}:</strong> {
                            weightData
                              .filter(record => record.petId === pet.id)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].notes
                          }
                        </Typography>
                      </Box>
                    )}

                    {/* Achievement Badge */}
                    {isGoalAchieved && (
                      <Box sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'success.main',
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <IconButton
                        size="small"
                        sx={{
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.light' }
                        }}
                        onClick={() => {
                          // Find the weight record for this pet and open edit dialog
                          const weightRecord = weightData.find(record => record.petId === pet.id);
                          if (weightRecord) {
                            handleEditWeightRecord(weightRecord);
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: 'success.main',
                          '&:hover': { bgcolor: 'success.light' }
                        }}
                        onClick={() => setAddWeightDialogOpen(true)}
                      >
                        <ScaleIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Enhanced Weight Goals Section */}
      <Paper sx={{ p: 4, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <FlagIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {t('weight.weightGoals')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('weight.goalsDescription') || 'Track your pet\'s weight journey and celebrate milestones'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddWeightGoalDialogOpen(true)}
          >
            {t('weight.addWeightGoal')}
          </Button>
        </Box>

        {weightGoals.length > 0 ? (
          <Grid container spacing={3}>
            {weightGoals.map((goal) => {
              const pet = pets.find(p => p.id === goal.pet_id);
              const currentWeight = pet?.weightKg || 0;
              const targetWeight = goal.target_weight;
              const progress = Math.min((currentWeight / targetWeight) * 100, 100);
              const isAchieved = currentWeight >= targetWeight;
              const isActive = goal.is_active;

              return (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={goal.id}>
                  <Card
                    sx={{
                      background: isAchieved
                        ? 'success.light'
                        : 'background.paper',
                      border: `2px solid ${isAchieved ? 'success.main' : 'grey.200'}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{
                          bgcolor: isAchieved ? 'success.main' : 'primary.main',
                          width: 40,
                          height: 40
                        }}>
                          <PetsIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {pet?.name || 'Unknown Pet'}
                          </Typography>
                          {goal.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {goal.description}
                            </Typography>
                          )}
                          <Chip
                            label={isAchieved ? t('weight.goalAchieved') : t('weight.goalInProgress')}
                            size="small"
                            color={isAchieved ? 'success' : 'warning'}
                            sx={{
                              fontSize: '0.75rem',
                              height: 20,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        </Box>
                        {isActive && (
                          <Badge color="success" variant="dot" />
                        )}
                      </Box>

                      {/* Progress Section */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('weight.progress')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {progress.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: isAchieved ? 'success.main' : 'primary.main'
                            }
                          }}
                        />
                      </Box>

                      {/* Stats */}
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScaleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {t('weight.currentWeight')}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {currentWeight} {goal.weight_unit}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FlagIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {t('weight.targetWeight')}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${goal.target_weight} ${goal.weight_unit}`}
                            size="small"
                            sx={{
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              '& .MuiChip-label': { fontSize: '0.75rem' }
                            }}
                          />
                        </Box>

                        {goal.target_date && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              {t('weight.targetDate')}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {new Date(goal.target_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Stack>

                      {/* Achievement Badge */}
                      {isAchieved && (
                        <Box sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'success.main',
                          borderRadius: '50%',
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <IconButton
                          size="small"
                          sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.light' }
                          }}
                          onClick={() => handleEditWeightGoal(goal)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light' }
                          }}
                          onClick={() => handleDeleteWeightGoal(goal.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'grey.300'
          }}>
            <HeartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
              {t('weight.noGoalsSet')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {t('weight.setGoalDescription') || 'Create personalized weight goals for your pets to track their health journey'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddWeightGoalDialogOpen(true)}
            >
              {t('weight.createFirstGoal')}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Add Weight Record Dialog */}
      <Dialog open={addWeightDialogOpen} onClose={() => setAddWeightDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('weight.addWeightRecord')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>{t('weight.selectPet')}</InputLabel>
                <Select
                  value={newWeightRecord.petId}
                  label={t('weight.selectPet')}
                  onChange={(e) => setNewWeightRecord(prev => ({ ...prev, petId: e.target.value }))}
                >
                  {pets.map((pet) => (
                    <MenuItem key={pet.id} value={pet.id?.toString()}>
                      {pet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }} sm={6}>
              <TextField
                fullWidth
                label={t('weight.weight')}
                type="number"
                value={newWeightRecord.weight}
                onChange={(e) => setNewWeightRecord(prev => ({ ...prev, weight: e.target.value }))}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('weight.weightUnit')}</InputLabel>
                <Select
                  value={newWeightRecord.weightUnit}
                  label={t('weight.weightUnit')}
                  onChange={(e) => setNewWeightRecord(prev => ({ ...prev, weightUnit: e.target.value as 'kg' | 'lbs' }))}
                >
                  <MenuItem value="kg">{t('pets.kg')}</MenuItem>
                  <MenuItem value="lbs">{t('pets.pounds')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('weight.date')}
                type="date"
                value={newWeightRecord.date}
                onChange={(e) => setNewWeightRecord(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('weight.notes')}
                multiline
                rows={3}
                value={newWeightRecord.notes}
                onChange={(e) => setNewWeightRecord(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('weight.notesPlaceholder')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWeightDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAddWeightRecord} variant="contained" disabled={!newWeightRecord.petId || !newWeightRecord.weight}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Weight Goal Dialog */}
      <Dialog open={addWeightGoalDialogOpen} onClose={() => setAddWeightGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('weight.addWeightGoal')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>{t('weight.selectPet')}</InputLabel>
                <Select
                  value={newWeightGoal.petId}
                  label={t('weight.selectPet')}
                  onChange={(e) => setNewWeightGoal(prev => ({ ...prev, petId: e.target.value }))}
                >
                  {pets.map((pet) => (
                    <MenuItem key={pet.id} value={pet.id?.toString()}>
                      {pet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }} sm={6}>
              <TextField
                fullWidth
                label={t('weight.targetWeight')}
                type="number"
                value={newWeightGoal.targetWeight}
                onChange={(e) => setNewWeightGoal(prev => ({ ...prev, targetWeight: e.target.value }))}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('weight.weightUnit')}</InputLabel>
                <Select
                  value={newWeightGoal.weightUnit}
                  label={t('weight.weightUnit')}
                  onChange={(e) => setNewWeightGoal(prev => ({ ...prev, weightUnit: e.target.value as 'kg' | 'lbs' }))}
                >
                  <MenuItem value="kg">{t('pets.kg')}</MenuItem>
                  <MenuItem value="lbs">{t('pets.pounds')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>{t('weight.goalType')}</InputLabel>
                <Select
                  value={newWeightGoal.goalType}
                  label={t('weight.goalType')}
                  onChange={(e) => setNewWeightGoal(prev => ({ ...prev, goalType: e.target.value as 'custom' | 'external_api' | 'vet_recommended' }))}
                >
                  <MenuItem value="custom">{t('weight.custom')}</MenuItem>
                  <MenuItem value="external_api">{t('weight.externalApi')}</MenuItem>
                  <MenuItem value="vet_recommended">{t('weight.vetRecommended')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('weight.goalDescription')}
                multiline
                rows={2}
                value={newWeightGoal.description}
                onChange={(e) => setNewWeightGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('weight.goalDescription')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('weight.targetDate')}
                type="date"
                value={newWeightGoal.targetDate}
                onChange={(e) => setNewWeightGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWeightGoalDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAddWeightGoal} variant="contained" disabled={!newWeightGoal.petId || !newWeightGoal.targetWeight}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Weight Record Dialog */}
      <Dialog open={editWeightDialogOpen} onClose={() => setEditWeightDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('weight.editWeightRecord')}</DialogTitle>
        <DialogContent>
          {editWeightRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('weight.selectPet')}</InputLabel>
                  <Select
                    value={editWeightRecord.petId.toString()}
                    label={t('weight.selectPet')}
                    onChange={(e) => setEditWeightRecord(prev => prev ? { ...prev, petId: parseInt(e.target.value) } : null)}
                  >
                    {pets.map((pet) => (
                      <MenuItem key={pet.id} value={pet.id?.toString()}>
                        {pet.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }} sm={6}>
                <TextField
                  fullWidth
                  label={t('weight.weight')}
                  type="number"
                  value={editWeightRecord.weight}
                  onChange={(e) => setEditWeightRecord(prev => prev ? { ...prev, weight: parseFloat(e.target.value) } : null)}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('weight.weightUnit')}</InputLabel>
                  <Select
                    value="kg"
                    label={t('weight.weightUnit')}
                    onChange={(e) => setEditWeightRecord(prev => prev ? { ...prev, weightUnit: e.target.value as 'kg' | 'lbs' } : null)}
                  >
                    <MenuItem value="kg">{t('pets.kg')}</MenuItem>
                    <MenuItem value="lbs">{t('pets.pounds')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('weight.date')}
                  type="date"
                  value={editWeightRecord.date.toString()}
                  onChange={(e) => setEditWeightRecord(prev => prev ? { ...prev, date: e.target.value } : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('weight.notes')}
                  multiline
                  rows={3}
                  value={editWeightRecord.notes || ''}
                  onChange={(e) => setEditWeightRecord(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder={t('weight.notesPlaceholder')}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWeightDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleUpdateWeightRecord} variant="contained" disabled={!editWeightRecord}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Weight Goal Dialog */}
      <Dialog open={editWeightGoalDialogOpen} onClose={() => setEditWeightGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('weight.editWeightGoal')}</DialogTitle>
        <DialogContent>
          {editWeightGoal && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('weight.selectPet')}</InputLabel>
                  <Select
                    value={editWeightGoal.pet_id.toString()}
                    label={t('weight.selectPet')}
                    onChange={(e) => setEditWeightGoal(prev => prev ? { ...prev, pet_id: parseInt(e.target.value) } : null)}
                  >
                    {pets.map((pet) => (
                      <MenuItem key={pet.id} value={pet.id?.toString()}>
                        {pet.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }} sm={6}>
                <TextField
                  fullWidth
                  label={t('weight.targetWeight')}
                  type="number"
                  value={editWeightGoal.target_weight}
                  onChange={(e) => setEditWeightGoal(prev => prev ? { ...prev, target_weight: parseFloat(e.target.value) } : null)}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('weight.weightUnit')}</InputLabel>
                  <Select
                    value={editWeightGoal.weight_unit}
                    label={t('weight.weightUnit')}
                    onChange={(e) => setEditWeightGoal(prev => prev ? { ...prev, weight_unit: e.target.value as 'kg' | 'lbs' } : null)}
                  >
                    <MenuItem value="kg">{t('pets.kg')}</MenuItem>
                    <MenuItem value="lbs">{t('pets.pounds')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('weight.goalType')}</InputLabel>
                  <Select
                    value={editWeightGoal.goal_type}
                    label={t('weight.goalType')}
                    onChange={(e) => setEditWeightGoal(prev => prev ? { ...prev, goal_type: e.target.value as 'custom' | 'external_api' | 'vet_recommended' } : null)}
                  >
                    <MenuItem value="custom">{t('weight.custom')}</MenuItem>
                    <MenuItem value="external_api">{t('weight.externalApi')}</MenuItem>
                    <MenuItem value="vet_recommended">{t('weight.vetRecommended')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('weight.goalDescription')}
                  multiline
                  rows={2}
                  value={editWeightGoal.description || ''}
                  onChange={(e) => setEditWeightGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder={t('weight.goalDescription')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('weight.targetDate')}
                  type="date"
                  value={editWeightGoal.target_date || ''}
                  onChange={(e) => setEditWeightGoal(prev => prev ? { ...prev, target_date: e.target.value } : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWeightGoalDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleUpdateWeightGoal} variant="contained" disabled={!editWeightGoal}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeightTrackingPage;
