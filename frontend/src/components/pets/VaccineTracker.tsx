import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalHospital as VetIcon,
  LocalHospital,
} from '@mui/icons-material';
import { dogVaccines, catVaccines } from '../../features/pets/vaccines';
import { 
  getPetVaccinations, 
  createVaccination, 
  updateVaccination, 
  deleteVaccination,
  getPetVaccinationSummary
} from '../../services/medical/vaccinationService';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { Pet } from '../../types/pets/pet';

interface VaccineRecord {
  id: string;
  name: string;
  type: string;
  administeredDate: string;
  nextDueDate: string;
  veterinarian: string;
  clinic: string;
  notes?: string;
  isOverdue: boolean;
  isDueSoon: boolean;
}

interface VaccineTrackerProps {
  pet: Pet;
}

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({ pet }) => {
  const { t } = useLocalization();
  
  // Safety check for pet data
  if (!pet) {
    return (
      <Card>
        <CardHeader title={t('pets.vaccineTracking')} />
        <CardContent>
          <Typography color="error">
            {t('pets.noPetDataAvailable')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  console.log('🔍 VaccineTracker: Rendering for pet:', pet.name, 'Type:', pet.type);

  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);
  const [vaccinationSummary, setVaccinationSummary] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    administeredDate: '',
    nextDueDate: '',
    veterinarian: '',
    clinic: '',
    notes: ''
  });

  // Fetch vaccination data from backend
  useEffect(() => {
    const fetchVaccinationData = async () => {
      if (!pet?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const [vaccinationsData, summaryData] = await Promise.all([
          getPetVaccinations(pet.id),
          getPetVaccinationSummary(pet.id)
        ]);
        
        // Transform backend data to frontend format
        const transformedRecords: VaccineRecord[] = vaccinationsData.vaccinations.map((v: any) => {
          const nextDueDate = v.next_due_date || '';
          const status = checkVaccineStatus(nextDueDate);
          
          return {
            id: v.id.toString(),
            name: v.vaccine_name,
            type: v.vaccine_type || 'Core',
            administeredDate: v.date_administered,
            nextDueDate,
            veterinarian: v.veterinarian || 'Unknown',
            clinic: v.clinic || 'Unknown',
            notes: v.notes,
            isOverdue: status.isOverdue,
            isDueSoon: status.isDueSoon,
          };
        });
        
        setVaccineRecords(transformedRecords);
        setVaccinationSummary(summaryData);
        
      } catch (error) {
        console.error('Error fetching vaccination data:', error);
        setError('Failed to load vaccination data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaccinationData();
  }, [pet?.id]);

  // Get recommended vaccines based on pet type
  const getRecommendedVaccines = () => {
    if (!pet) {
      console.warn('⚠️ VaccineTracker: No pet data available');
      return [];
    }
    
    const petType = pet.type?.toLowerCase() || 'unknown';
    console.log('🔍 VaccineTracker: Getting vaccines for pet type:', petType);
    
    if (petType === 'dog') {
      return dogVaccines;
    } else if (petType === 'cat') {
      return catVaccines;
    }
    
    console.log('⚠️ VaccineTracker: Unknown pet type, returning empty vaccine list');
    return [];
  };

  // Calculate next due date based on vaccine frequency
  const calculateNextDueDate = (vaccineName: string, administeredDate: string): string => {
    const vaccines = getRecommendedVaccines();
    const vaccine = vaccines.find(v => v.name === vaccineName);
    
    if (!vaccine) return '';
    
    const date = new Date(administeredDate);
    let nextDate = new Date(date);
    
    switch (vaccine.frequency) {
      case 'Yearly':
        nextDate.setFullYear(date.getFullYear() + 1);
        break;
      case '2 years':
        nextDate.setFullYear(date.getFullYear() + 2);
        break;
      case '6 months':
        nextDate.setMonth(date.getMonth() + 6);
        break;
      case '2 months':
        nextDate.setMonth(date.getMonth() + 2);
        break;
      default:
        nextDate.setFullYear(date.getFullYear() + 1);
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  // Check if vaccine is overdue or due soon
  const checkVaccineStatus = (nextDueDate: string) => {
    if (!nextDueDate) return { isOverdue: false, isDueSoon: false, days: 0 };
    
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return { isOverdue: true, isDueSoon: false, days: Math.abs(daysUntilDue) };
    } else if (daysUntilDue <= 30) {
      return { isOverdue: false, isDueSoon: true, days: daysUntilDue };
    } else {
      return { isOverdue: false, isDueSoon: false, days: daysUntilDue };
    }
  };

  // Add new vaccine record
  const handleAddVaccine = async () => {
    if (!pet?.id) return;
    
    try {
      const nextDueDate = calculateNextDueDate(formData.name, formData.administeredDate);
      
      const vaccinationData = {
        vaccine_name: formData.name,
        date_administered: formData.administeredDate,
        next_due_date: nextDueDate,
        veterinarian: formData.veterinarian,
        clinic: formData.clinic,
        notes: formData.notes,
        is_completed: true,
        reminder_sent: false
      };
      
              await createVaccination(pet.id, {
        petId: pet.id,
        vaccineName: vaccinationData.vaccine_name,
        dateAdministered: vaccinationData.date_administered,
        nextDueDate: vaccinationData.next_due_date,
        veterinarian: vaccinationData.veterinarian,
        clinic: vaccinationData.clinic,
        notes: vaccinationData.notes,
        isCompleted: vaccinationData.is_completed,
        reminderSent: vaccinationData.reminder_sent
      });
      
      // Refresh data
      const updatedData = await getPetVaccinations(pet.id);
      const transformedRecords: VaccineRecord[] = updatedData.vaccinations.map((v: any) => {
        const nextDueDate = v.next_due_date || '';
        const status = checkVaccineStatus(nextDueDate);
        
        return {
          id: v.id.toString(),
          name: v.vaccine_name,
          type: v.vaccine_type || 'Core',
          administeredDate: v.date_administered,
          nextDueDate,
          veterinarian: v.veterinarian || 'Unknown',
          clinic: v.clinic || 'Unknown',
          notes: v.notes,
          isOverdue: status.isOverdue,
          isDueSoon: status.isDueSoon,
        };
      });
      
      setVaccineRecords(transformedRecords);
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        administeredDate: '',
        nextDueDate: '',
        veterinarian: '',
        clinic: '',
        notes: ''
      });
      setAddDialogOpen(false);
      
    } catch (error) {
      console.error('Error adding vaccine:', error);
      setError('Failed to add vaccine record. Please try again.');
    }
  };

  // Edit vaccine record
  const handleEditVaccine = async () => {
    if (!editingVaccine || !pet?.id) return;
    
    try {
      const nextDueDate = calculateNextDueDate(formData.name, formData.administeredDate);
      
      const updates = {
        vaccine_name: formData.name,
        date_administered: formData.administeredDate,
        next_due_date: nextDueDate,
        veterinarian: formData.veterinarian,
        clinic: formData.clinic,
        notes: formData.notes,
      };
      
              await updateVaccination(parseInt(editingVaccine.id), {
        vaccineName: updates.vaccine_name,
        dateAdministered: updates.date_administered,
        nextDueDate: updates.next_due_date,
        veterinarian: updates.veterinarian,
        clinic: updates.clinic,
        notes: updates.notes,
        isCompleted: true,
        reminderSent: false
      });
      
      // Refresh data
      const updatedData = await getPetVaccinations(pet.id);
      const transformedRecords: VaccineRecord[] = updatedData.vaccinations.map((v: any) => {
        const nextDueDate = v.next_due_date || '';
        const status = checkVaccineStatus(nextDueDate);
        
        return {
          id: v.id.toString(),
          name: v.vaccine_name,
          type: v.vaccine_type || 'Core',
          administeredDate: v.date_administered,
          nextDueDate,
          veterinarian: v.veterinarian || 'Unknown',
          clinic: v.clinic || 'Unknown',
          notes: v.notes,
          isOverdue: status.isOverdue,
          isDueSoon: status.isDueSoon,
        };
      });
      
      setVaccineRecords(transformedRecords);
      setEditingVaccine(null);
      setEditDialogOpen(false);
      
    } catch (error) {
      console.error('Error updating vaccine:', error);
      setError('Failed to update vaccine record. Please try again.');
    }
  };

  // Delete vaccine record
  const handleDeleteVaccine = async (vaccineId: string) => {
    if (!pet?.id) return;
    
    try {
              await deleteVaccination(parseInt(vaccineId));
      
      // Refresh data
      const updatedData = await getPetVaccinations(pet.id);
      const transformedRecords: VaccineRecord[] = updatedData.vaccinations.map((v: any) => {
        const nextDueDate = v.next_due_date || '';
        const status = checkVaccineStatus(nextDueDate);
        
        return {
          id: v.id.toString(),
          name: v.vaccine_name,
          type: v.vaccine_type || 'Core',
          administeredDate: v.date_administered,
          nextDueDate,
          veterinarian: v.veterinarian || 'Unknown',
          clinic: v.clinic || 'Unknown',
          notes: v.notes,
          isOverdue: status.isOverdue,
          isDueSoon: status.isDueSoon,
        };
      });
      
      setVaccineRecords(transformedRecords);
      
    } catch (error) {
      console.error('Error deleting vaccine:', error);
      setError('Failed to delete vaccine record. Please try again.');
    }
  };

  // Get smart suggestions for vaccines
  const getSmartSuggestions = () => {
    const recommendations: Array<{
      name: string;
      type: string;
      frequency: string;
      description: string;
      priority: 'urgent' | 'high' | 'medium';
    }> = [];

    const recommendedVaccines = getRecommendedVaccines();
    
    recommendedVaccines.forEach(vaccine => {
      // Check if vaccine is already recorded
      const existingRecord = vaccineRecords.find(record => record.name === vaccine.name);
      
      if (!existingRecord) {
        // New vaccine recommendation
        recommendations.push({
          name: vaccine.name,
          type: vaccine.type || 'Core',
          frequency: vaccine.frequency,
          description: `${vaccine.name} is recommended for your ${pet.type}`,
          priority: 'medium'
        });
      } else {
        // Check if vaccine is due soon or overdue
        const status = checkVaccineStatus(existingRecord.nextDueDate);
        
        if (status.isOverdue) {
          recommendations.push({
            name: vaccine.name,
            type: vaccine.type || 'Core',
            frequency: vaccine.frequency,
            description: `${vaccine.name} is overdue by ${status.days} days`,
            priority: 'urgent'
          });
        } else if (status.isDueSoon) {
          recommendations.push({
            name: vaccine.name,
            type: vaccine.type || 'Core',
            frequency: vaccine.frequency,
            description: `${vaccine.name} is due in ${status.days} days`,
            priority: 'high'
          });
        }
      }
    });
    
    return recommendations.sort((a, b) => {
      if (a.priority === 'urgent') return -1;
      if (b.priority === 'urgent') return 1;
      if (a.priority === 'high') return -1;
      if (b.priority === 'high') return 1;
      return 0;
    });
  };

  // Get status display for vaccine records
  const getStatusDisplay = (vaccine: VaccineRecord) => {
    if (vaccine.isOverdue) {
      return {
        icon: <WarningIcon color="error" />,
        text: 'Overdue',
        color: 'error' as const
      };
    } else if (vaccine.isDueSoon) {
      return {
        icon: <ScheduleIcon color="warning" />,
        text: 'Due Soon',
        color: 'warning' as const
      };
    } else {
      return {
        icon: <CheckCircleIcon color="success" />,
        text: 'Up to Date',
        color: 'success' as const
      };
    }
  };

  // Open edit dialog
  const openEditDialog = (vaccine: VaccineRecord) => {
    setEditingVaccine(vaccine);
    setFormData({
      name: vaccine.name,
      type: vaccine.type,
      administeredDate: vaccine.administeredDate,
      nextDueDate: vaccine.nextDueDate,
      veterinarian: vaccine.veterinarian,
      clinic: vaccine.clinic,
      notes: vaccine.notes || ''
    });
    setEditDialogOpen(true);
  };

  // Update form data when editing vaccine
  useEffect(() => {
    if (editingVaccine) {
      setFormData({
        name: editingVaccine.name,
        type: editingVaccine.type,
        administeredDate: editingVaccine.administeredDate,
        nextDueDate: editingVaccine.nextDueDate,
        veterinarian: editingVaccine.veterinarian,
        clinic: editingVaccine.clinic,
        notes: editingVaccine.notes || ''
      });
    }
  }, [editingVaccine]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Vaccine Tracking" />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Vaccine Tracking" />
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const smartSuggestions = getSmartSuggestions();

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VaccinesIcon color="primary" />
            <Typography variant="h6">Vaccine Tracking</Typography>
          </Box>
        }
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
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              variant="contained"
              color="primary"
            >
              Add Vaccine
            </Button>
          </Box>
        }
      />

      <CardContent>
        {/* Vaccination Summary */}
        {vaccinationSummary && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              📊 Vaccination Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Alert severity="info">
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Total Vaccinations
                  </Typography>
                  <Typography variant="h4">{vaccinationSummary.total_vaccinations}</Typography>
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Alert severity={vaccinationSummary.up_to_date ? "success" : "warning"}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Status
                  </Typography>
                  <Typography variant="h6">
                    {vaccinationSummary.up_to_date ? "Up to Date" : "Needs Attention"}
                  </Typography>
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Alert severity={vaccinationSummary.overdue_count > 0 ? "error" : "success"}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Overdue
                  </Typography>
                  <Typography variant="h6">{vaccinationSummary.overdue_count}</Typography>
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Alert severity="info">
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Next Due
                  </Typography>
                  <Typography variant="h6">
                    {vaccinationSummary.next_due_date ? 
                      new Date(vaccinationSummary.next_due_date).toLocaleDateString() : 
                      "None"
                    }
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              💡 Smart Recommendations
            </Typography>
            <Grid container spacing={2}>
              {smartSuggestions.map((suggestion, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6 }}>
                  <Alert 
                    severity={suggestion.priority === 'urgent' ? 'error' : suggestion.priority === 'high' ? 'warning' : 'info'}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      {suggestion.name}
                    </Typography>
                    <Typography variant="body2">
                      {suggestion.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Frequency: {suggestion.frequency} | Type: {suggestion.type}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Current Vaccine Records */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vaccine History
        </Typography>
        
        {vaccineRecords.length === 0 ? (
          <Alert severity="info">
            No vaccine records found. Add vaccines to start tracking your pet's immunization history.
          </Alert>
        ) : (
          <List>
            {vaccineRecords.map((vaccine) => {
              const status = getStatusDisplay(vaccine);
              return (
                <ListItem key={vaccine.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <ListItemIcon>
                    {status.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                          {vaccine.name}
                        </Typography>
                        <Chip 
                          label={status.text} 
                          color={status.color} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Administered: {new Date(vaccine.administeredDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          Next Due: {new Date(vaccine.nextDueDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          Veterinarian: {vaccine.veterinarian} at {vaccine.clinic}
                        </Typography>
                        {vaccine.notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {vaccine.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box>
                    <IconButton size="small" onClick={() => openEditDialog(vaccine)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteVaccine(vaccine.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}

        {/* Expanded Content with Collapse */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Additional Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Alert severity="info" icon={<ScheduleIcon />}>
                  <Typography variant="body2">
                    Vaccines are automatically scheduled based on recommended frequencies.
                  </Typography>
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="body2">
                    Keep your pet's vaccination records up to date for optimal health.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {/* Add Vaccine Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VaccinesIcon color="primary" />
              Add New Vaccine Record
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Vaccine Name</InputLabel>
                  <Select
                    value={formData.name}
                    onChange={(e: SelectChangeEvent) => setFormData({ ...formData, name: e.target.value })}
                    label="Vaccine Name"
                  >
                    {getRecommendedVaccines().map((vaccine) => (
                      <MenuItem key={vaccine.name} value={vaccine.name}>
                        {vaccine.name} ({vaccine.frequency})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Vaccine Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Core, Non-core, Required"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Administered Date"
                  value={formData.administeredDate}
                  onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Next Due Date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Will be calculated automatically based on vaccine frequency"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Veterinarian"
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                  placeholder="Dr. Smith"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <VetIcon color="action" fontSize="small" />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  placeholder="Animal Hospital"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <LocalHospital color="action" fontSize="small" />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about the vaccination..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVaccine} variant="contained" color="primary">
              Add Vaccine
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Vaccine Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" />
              Edit Vaccine Record
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Vaccine Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Vaccine Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Administered Date"
                  value={formData.administeredDate}
                  onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Next Due Date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Veterinarian"
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <VetIcon color="action" fontSize="small" />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <LocalHospital color="action" fontSize="small" />
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditVaccine} variant="contained" color="primary">
              Update Vaccine
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
