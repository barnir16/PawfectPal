import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  useTheme,
} from '@mui/material';
import {
  MonitorWeight as WeightIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { Pet } from '../../types/pets/pet';

interface WeightRecord {
  id: string;
  weight: number;
  weightUnit: string;
  date: string;
  notes?: string;
  changeFromPrevious?: number;
  isHealthy?: boolean;
}

interface WeightAlert {
  id: string;
  type: 'gain' | 'loss' | 'stable';
  message: string;
  severity: 'info' | 'warning' | 'error';
  date: string;
}

interface PetWeightMonitorProps {
  pet: Pet;
}

export const PetWeightMonitor: React.FC<PetWeightMonitorProps> = ({ pet }) => {
  const theme = useTheme();
  const { t } = useLocalization();
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [weightAlerts, setWeightAlerts] = useState<WeightAlert[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null);
  const [formData, setFormData] = useState({
    weight: '',
    weightUnit: 'kg',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Weight thresholds for alerts (in kg)
  const getWeightThresholds = () => {
    const petType = pet.type?.toLowerCase();
    const currentWeight = pet.weightKg || pet.weightKg || 0;
    
    if (petType === 'dog') {
      if (currentWeight < 5) return { min: 2, max: 8, healthyRange: '2-8 kg' };
      if (currentWeight < 15) return { min: 8, max: 22, healthyRange: '8-22 kg' };
      if (currentWeight < 30) return { min: 22, max: 40, healthyRange: '22-40 kg' };
      return { min: 40, max: 60, healthyRange: '40-60 kg' };
    } else if (petType === 'cat') {
      return { min: 3, max: 6, healthyRange: '3-6 kg' };
    }
    
    return { min: 0, max: 100, healthyRange: 'Unknown' };
  };

  // Initialize with current pet weight
  useEffect(() => {
    if (pet.weightKg || pet.weightKg) {
      const currentWeight = pet.weightKg || pet.weightKg || 0;
      const currentUnit = pet.weightUnit || 'kg';
      
      setWeightRecords([{
        id: 'current',
        weight: currentWeight,
        weightUnit: currentUnit,
        date: new Date().toISOString().split('T')[0],
        notes: 'Current weight from pet profile',
        isHealthy: isWeightHealthy(currentWeight, currentUnit)
      }]);
    }
  }, [pet]);

  // Check if weight is within healthy range
  const isWeightHealthy = (weight: number, unit: string): boolean => {
    const thresholds = getWeightThresholds();
    let weightInKg = weight;
    
    if (unit === 'lbs') {
      weightInKg = weight * 0.453592;
    }
    
    return weightInKg >= thresholds.min && weightInKg <= thresholds.max;
  };

  // Calculate weight change percentage
  const calculateWeightChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Add new weight record
  const handleAddWeight = () => {
    const newWeight = parseFloat(formData.weight);
    const previousWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight : 0;
    const changeFromPrevious = previousWeight > 0 ? calculateWeightChange(newWeight, previousWeight) : 0;
    
    const newRecord: WeightRecord = {
      id: Date.now().toString(),
      weight: newWeight,
      weightUnit: formData.weightUnit,
      date: formData.date,
      notes: formData.notes,
      changeFromPrevious,
      isHealthy: isWeightHealthy(newWeight, formData.weightUnit)
    };
    
    setWeightRecords([...weightRecords, newRecord]);
    
    // Check for weight alerts
    checkWeightAlerts(newRecord, previousWeight);
    
    // Reset form
    setFormData({
      weight: '',
      weightUnit: 'kg',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setAddDialogOpen(false);
  };

  // Check for weight alerts
  const checkWeightAlerts = (newRecord: WeightRecord, previousWeight: number) => {
    const alerts: WeightAlert[] = [];
    const changePercent = Math.abs(newRecord.changeFromPrevious || 0);
    
    // Sudden weight loss (more than 10% in short time)
    if (newRecord.changeFromPrevious && newRecord.changeFromPrevious < -10) {
      alerts.push({
        id: Date.now().toString(),
        type: 'loss',
        message: `⚠️ ${pet.name} has lost ${Math.abs(newRecord.changeFromPrevious).toFixed(1)}% of their weight. This could indicate a health issue.`,
        severity: 'warning',
        date: new Date().toISOString()
      });
    }
    
    // Sudden weight gain (more than 15% in short time)
    if (newRecord.changeFromPrevious && newRecord.changeFromPrevious > 15) {
      alerts.push({
        id: Date.now().toString(),
        type: 'gain',
        message: `⚠️ ${pet.name} has gained ${newRecord.changeFromPrevious.toFixed(1)}% of their weight. Consider adjusting diet and exercise.`,
        severity: 'warning',
        date: new Date().toISOString()
      });
    }
    
    // Weight outside healthy range
    if (!newRecord.isHealthy) {
      const thresholds = getWeightThresholds();
      alerts.push({
        id: Date.now().toString(),
        type: 'stable',
        message: `🚨 ${pet.name}'s weight (${newRecord.weight}${newRecord.weightUnit}) is outside the healthy range (${thresholds.healthyRange}). Consult your veterinarian.`,
        severity: 'error',
        date: new Date().toISOString()
      });
    }
    
    // Stable weight (good news)
    if (changePercent < 5 && changePercent > 0) {
      alerts.push({
        id: Date.now().toString(),
        type: 'stable',
        message: `✅ ${pet.name}'s weight is stable. Great job maintaining their health!`,
        severity: 'info',
        date: new Date().toISOString()
      });
    }
    
    setWeightAlerts([...weightAlerts, ...alerts]);
  };

  // Edit weight record
  const handleEditWeight = () => {
    if (!editingRecord) return;
    
    const updatedRecords = weightRecords.map(record => 
      record.id === editingRecord.id 
        ? { ...record, ...formData, weight: parseFloat(formData.weight) }
        : record
    );
    
    setWeightRecords(updatedRecords);
    setEditingRecord(null);
    setEditDialogOpen(false);
  };

  // Delete weight record
  const handleDeleteWeight = (recordId: string) => {
    setWeightRecords(weightRecords.filter(record => record.id !== recordId));
  };

  // Open edit dialog
  const openEditDialog = (record: WeightRecord) => {
    setEditingRecord(record);
    setFormData({
      weight: record.weight.toString(),
      weightUnit: record.weightUnit,
      date: record.date,
      notes: record.notes || ''
    });
    setEditDialogOpen(true);
  };

  // Prepare chart data
  const chartData = weightRecords.map(record => ({
    date: new Date(record.date).toLocaleDateString(),
    weight: record.weight,
    healthy: record.isHealthy ? 1 : 0
  }));

  // Get current weight status
  const getCurrentWeightStatus = () => {
    if (weightRecords.length === 0) return { status: 'No data', color: 'default' as const };
    
    const latest = weightRecords[weightRecords.length - 1];
    if (latest.isHealthy) return { status: 'Healthy', color: 'success' as const };
    return { status: 'Needs attention', color: 'warning' as const };
  };

  const currentStatus = getCurrentWeightStatus();
  const thresholds = getWeightThresholds();

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WeightIcon color="primary" />
            <Typography variant="h6">{t('pets.weightMonitor')}</Typography>
          </Box>
        }
        action={
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            variant="contained"
            color="primary"
          >
            {t('pets.addWeightRecord')}
          </Button>
        }
      />

      <CardContent>
        {/* Current Weight Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            📊 {t('pets.weightMonitor')}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Alert severity={currentStatus.color === 'default' ? 'info' : currentStatus.color} icon={<WeightIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {t('common.status')}
                </Typography>
                <Typography variant="h6">{currentStatus.status}</Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Alert severity="info">
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {t('weight.currentWeight')}
                </Typography>
                <Typography variant="h6">
                  {weightRecords.length > 0 ? 
                    `${weightRecords[weightRecords.length - 1].weight} ${weightRecords[weightRecords.length - 1].weightUnit}` : 
                    'No data'
                  }
                </Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Alert severity="success">
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {t('weight.healthyRange')}
                </Typography>
                <Typography variant="h6">{thresholds.healthyRange}</Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Alert severity="info">
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {t('weight.records')}
                </Typography>
                <Typography variant="h6">{weightRecords.length}</Typography>
              </Alert>
            </Grid>
          </Grid>
        </Box>

        {/* Weight Alerts */}
        {weightAlerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              🚨 {t('weight.weightAlerts')}
            </Typography>
            <Grid container spacing={2}>
              {weightAlerts.slice(-3).map((alert) => (
                <Grid key={alert.id} size={{ xs: 12 }}>
                  <Alert severity={alert.severity} sx={{ mb: 1 }}>
                    <Typography variant="body2">{alert.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(alert.date).toLocaleDateString()}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Weight Chart */}
        {weightRecords.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              📈 Weight Trend Chart
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={2}
                    dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {/* Weight History */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Weight History
        </Typography>
        
        {weightRecords.length === 0 ? (
          <Alert severity="info">
            No weight records found. Add your first weight measurement to start tracking.
          </Alert>
        ) : (
          <List>
            {weightRecords.map((record) => (
              <ListItem key={record.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  {record.isHealthy ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        {record.weight} {record.weightUnit}
                      </Typography>
                      {record.changeFromPrevious && (
                        <Chip
                          label={`${record.changeFromPrevious > 0 ? '+' : ''}${record.changeFromPrevious.toFixed(1)}%`}
                          color={record.changeFromPrevious > 0 ? 'warning' : 'info'}
                          size="small"
                          icon={record.changeFromPrevious > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        />
                      )}
                      <Chip
                        label={record.isHealthy ? 'Healthy' : 'Needs Attention'}
                        color={record.isHealthy ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Date: {new Date(record.date).toLocaleDateString()}
                      </Typography>
                      {record.notes && (
                        <Typography variant="body2" color="text.secondary">
                          Notes: {record.notes}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <Box>
                  <IconButton size="small" onClick={() => openEditDialog(record)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteWeight(record.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        {/* Add Weight Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WeightIcon color="primary" />
              {t('pets.addWeightRecord')}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('pets.weight')}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder={t('pets.weight')}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.weightUnit}
                    onChange={(e: SelectChangeEvent) => setFormData({ ...formData, weightUnit: e.target.value })}
                    label="Unit"
                  >
                    <MenuItem value="kg">Kilograms (kg)</MenuItem>
                    <MenuItem value="lbs">Pounds (lbs)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('pets.date')}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('pets.notes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('pets.notes')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddWeight} variant="contained" color="primary">
              {t('pets.addWeight')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Weight Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" />
              {t('pets.editWeightRecord')}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('pets.weight')}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.weightUnit}
                    onChange={(e: SelectChangeEvent) => setFormData({ ...formData, weightUnit: e.target.value })}
                    label="Unit"
                  >
                    <MenuItem value="kg">Kilograms (kg)</MenuItem>
                    <MenuItem value="lbs">Pounds (lbs)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('pets.date')}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('pets.notes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleEditWeight} variant="contained" color="primary">
              {t('pets.updatePet')}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
