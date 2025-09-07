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
  IconButton
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { getPets } from '../../../services/pets/petService';

import { WeightService } from '../../../services/weight/weightService';
import WeightGoalService, { WeightGoal } from '../../../services/weight/weightGoalService';

interface WeightRecord {
  date: Date | string;
  weight: number;
  petId: number;
  petName: string;
}

export const WeightTrackingPage = () => {
  const { t } = useLocalization();
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [weightData, setWeightData] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addWeightDialogOpen, setAddWeightDialogOpen] = useState(false);
  const [addWeightGoalDialogOpen, setAddWeightGoalDialogOpen] = useState(false);
  const [weightGoals, setWeightGoals] = useState<WeightGoal[]>([]);

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
        
        // Ensure all weight records have pet names
        realWeightData = realWeightData.map(record => ({
          ...record,
          petName: record.petName || petsData.find(p => p.id === record.petId)?.name || `Pet ${record.petId}`
        }));
        
        // Add current weights from pets if they exist and no weight records
        if (realWeightData.length === 0) {
          petsData.forEach(pet => {
            if (pet.weightKg) {
              realWeightData.push({
                date: new Date().toISOString().split('T')[0],
                weight: pet.weightKg,
                petId: pet.id || 0,
                petName: pet.name
              });
            }
          });
        }
       
       setWeightData(realWeightData);
       
       // Load weight goals
       try {
         const goals = await WeightGoalService.getAllWeightGoals();
         setWeightGoals(goals);
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
        petId: parseInt(newWeightRecord.petId),
        weight: parseFloat(newWeightRecord.weight),
        weightUnit: newWeightRecord.weightUnit,
        date: newWeightRecord.date,
        notes: newWeightRecord.notes || undefined,
        source: 'manual'
      });
      
      if (record) {
        // Add the new record to the local state
        setWeightData(prev => [...prev, {
          date: record.date.toISOString().split('T')[0],
          weight: record.weight,
          petId: record.petId,
          petName: pets.find(p => p.id === record.petId)?.name || 'Unknown Pet'
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
      console.error('Error adding weight record:', error);
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

  const filteredData = selectedPet === 'all' 
    ? weightData 
    : weightData.filter(record => record.petId.toString() === selectedPet);

  // Process chart data properly
  const chartData = filteredData.reduce((acc: any[], record) => {
    // Get pet name from pets array if not available in record
    const petName = record.petName || pets.find(p => p.id === record.petId)?.name || `Pet ${record.petId}`;
    
    // Convert date to string for chart display
    const dateString = typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0];
    
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
      <Typography variant="h4" component="h1" gutterBottom>
        {t('weight.weightTracking')}
      </Typography>
      
             <Paper sx={{ p: 3, mb: 3 }}>
         <Grid container spacing={3} alignItems="center">
           <Grid size={{ xs: 12, md: 6 }}>
             <Typography variant="h6" gutterBottom>
               {t('weight.trackAllPets')}
             </Typography>
             <Typography variant="body2" color="text.secondary">
               {t('weight.monitorWeightTrends')}
             </Typography>
           </Grid>
           <Grid size={{ xs: 12, md: 6 }}>
             <FormControl fullWidth>
               <InputLabel>{t('weight.selectPet')}</InputLabel>
               <Select
                 value={selectedPet}
                 label={t('weight.selectPet')}
                 onChange={(e) => setSelectedPet(e.target.value)}
               >
                 <MenuItem value="all">{t('weight.allPets')}</MenuItem>
                 {pets.map((pet) => (
                   <MenuItem key={pet.id} value={pet.id?.toString()}>
                     {pet.name}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Grid>
         </Grid>
       </Paper>

             <Paper sx={{ p: 3, mb: 3 }}>
         
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
           <Typography variant="h6">
             {t('weight.weightChart')}
           </Typography>
                     <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddWeightDialogOpen(true)}
            >
              {t('weight.addWeightRecord')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setAddWeightGoalDialogOpen(true)}
            >
              {t('weight.addWeightGoal')}
            </Button>
          </Box>
         </Box>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: t('weight.weight') + ' (' + t('pets.kg') + ')', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {pets.map((pet) => (
                <Line
                  key={pet.id}
                  type="monotone"
                  dataKey={pet.name}
                  stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('weight.noDataAvailable')}
          </Typography>
        )}
              </Paper>

                 {/* Current Weights Section */}
         <Paper sx={{ p: 3, mb: 3 }}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                           <Typography variant="h6">
                {t('weight.currentWeights')}
              </Typography>
              <Button
                variant="outlined"
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
           <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
             <Grid container spacing={2}>
               <Grid size={{ xs: 12, sm: 4 }}>
                 <Typography variant="h6" color="primary">
                   {pets.length}
                 </Typography>
                                   <Typography variant="body2" color="text.secondary">
                    {t('weight.totalPets')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="h6" color="primary">
                    {pets.filter(p => p.weightKg).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('weight.withWeightData')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="h6" color="primary">
                    {pets.filter(p => p.weightKg).length > 0 
                      ? (pets.filter(p => p.weightKg).reduce((sum, p) => sum + (p.weightKg || 0), 0) / pets.filter(p => p.weightKg).length).toFixed(1)
                      : '0'} {t('pets.kg')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('weight.averageWeight')}
                  </Typography>
               </Grid>
             </Grid>
           </Box>
          <Grid container spacing={2}>
            {pets.map((pet) => {
              const currentWeight = pet.weightKg || 0;
              const weightUnit = pet.weightUnit || 'kg';
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pet.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {pet.name}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {currentWeight} {weightUnit}
                      </Typography>
                                             <Typography variant="body2" color="text.secondary">
                         {pet.breed || pet.breedType || t('pets.notSpecified')}
                       </Typography>
                       <Typography variant="body2" color="text.secondary">
                         {t('pets.age')}: {pet.age ? (pet.age < 1 ? `${Math.floor(pet.age * 12)} ${t('pets.months')}` : `${pet.age} ${t('pets.years')}`) : t('pets.unknownAge')}
                       </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

              

      {/* Weight Goals Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('weight.weightGoals')}
        </Typography>
        {weightGoals.length > 0 ? (
          <Grid container spacing={2}>
            {weightGoals.map((goal) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={goal.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {pets.find(p => p.id === goal.pet_id)?.name || 'Unknown Pet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('weight.targetWeight')}: {goal.target_weight} {goal.weight_unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('weight.goalType')}: {t(`weight.${goal.goal_type}`)}
                    </Typography>
                    {goal.description && (
                      <Typography variant="body2" color="text.secondary">
                        {goal.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('weight.noGoalsSet')}
          </Typography>
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
    </Box>
  );
};

export default WeightTrackingPage;
