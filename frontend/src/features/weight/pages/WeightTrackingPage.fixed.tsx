import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
import Grid from '@mui/material/Unstable_Grid2';
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

// Helper function to convert between WeightRecord and LocalWeightRecord
const toLocalWeightRecord = (record: WeightRecord): LocalWeightRecord => ({
  id: record.id,
  petId: record.pet_id,
  date: record.date instanceof Date ? record.date.toISOString().split('T')[0] : record.date,
  weight: record.weight,
  weightUnit: record.weight_unit,
  notes: record.notes,
  source: record.source,
  petName: record.petName,
  created_at: record.created_at,
  updated_at: record.updated_at
});

const toWeightRecord = (record: LocalWeightRecord): Omit<WeightRecord, 'id' | 'created_at' | 'updated_at'> & { id?: number } => ({
  id: record.id,
  pet_id: record.petId,
  date: new Date(record.date),
  weight: record.weight,
  weight_unit: record.weightUnit,
  notes: record.notes,
  source: record.source
});

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

      // Convert weight records to local format
      const localWeightData = realWeightData.map(toLocalWeightRecord);
      
      // Add current weights from pets if they exist and no weight records
      if (realWeightData.length === 0) {
        petsData.forEach(pet => {
          if (pet.weightKg) {
            localWeightData.push({
              petId: pet.id || 0,
              date: new Date().toISOString().split('T')[0],
              weight: pet.weightKg,
              weightUnit: 'kg',
              source: 'manual',
              petName: pet.name
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

    try {
      const record = await WeightService.createWeightRecord({
        pet_id: parseInt(newWeightRecord.petId),
        weight: parseFloat(newWeightRecord.weight),
        weight_unit: newWeightRecord.weightUnit,
        date: newWeightRecord.date,
        notes: newWeightRecord.notes || undefined,
        source: 'manual'
      });

      if (record) {
        setWeightData(prev => [...prev, toLocalWeightRecord(record)]);
        setNewWeightRecord({
          petId: '',
          weight: '',
          weightUnit: 'kg',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setAddWeightDialogOpen(false);
      }
    } catch (err) {
      console.error('Error adding weight record:', err);
      setError('Failed to add weight record');
    }
  };

  // Rest of the component code...
  // [Previous JSX and other functions remain the same]

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Typography variant="h4" gutterBottom>
            {t('weightTracking.title')}
          </Typography>
        </Grid>
        
        {/* Add your component JSX here */}
        
      </Grid>
    </Box>
  );
};

export default WeightTrackingPage;
