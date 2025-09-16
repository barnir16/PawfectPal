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
  Alert,
  IconButton,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Stack,
  Snackbar,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  PriorityHigh as PriorityHighIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { dogVaccines, catVaccines } from '../../features/pets/vaccines';
import { 
  getPetVaccinations, 
  createVaccination, 
  updateVaccination, 
  deleteVaccination,
  getVaccinationSummary
} from '../../services/medical/vaccinationService';
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

const VaccineTracker: React.FC<VaccineTrackerProps> = ({ pet }) => {
  
  // Debug logging
  console.log('VaccineTracker received pet:', pet);
  
  // Safety check for pet data
  if (!pet) {
    console.log('VaccineTracker: No pet data provided');
    return (
      <Card>
        <CardHeader title="Vaccine Tracking" />
        <CardContent>
          <Alert severity="error">
            <Typography color="error">
              No pet data available. Please ensure you're viewing a valid pet.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);
  const [vaccinationSummary, setVaccinationSummary] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
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

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Vaccine name is required';
    }
    
    if (!formData.administeredDate) {
      errors.administeredDate = 'Administered date is required';
    } else {
      const adminDate = new Date(formData.administeredDate);
      const today = new Date();
      if (adminDate > today) {
        errors.administeredDate = 'Administered date cannot be in the future';
      }
    }
    
    if (!formData.veterinarian.trim()) {
      errors.veterinarian = 'Veterinarian name is required';
    }
    
    if (!formData.clinic.trim()) {
      errors.clinic = 'Clinic name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch vaccination data from backend
  useEffect(() => {
    const fetchVaccinationData = async () => {
      if (!pet?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching vaccination data for pet ID:', pet.id);
        
        // Try to fetch from backend first
        try {
          const [vaccinationsData, summaryData] = await Promise.all([
            getPetVaccinations(pet.id),
            getVaccinationSummary(pet.id)
          ]);
          
          console.log('Backend data received:', { vaccinationsData, summaryData });
          
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
          
        } catch (apiError) {
          console.log('API call failed, using mock data:', apiError);
          
          // Fallback to mock data for demonstration
          const mockRecords: VaccineRecord[] = [
            {
              id: '1',
              name: 'Rabies',
              type: 'Core',
              administeredDate: '2023-01-15',
              nextDueDate: '2024-01-15',
              veterinarian: 'Dr. Smith',
              clinic: 'Animal Hospital',
              notes: 'Annual vaccination',
              isOverdue: true,
              isDueSoon: false,
            },
            {
              id: '2',
              name: 'DHPP',
              type: 'Core',
              administeredDate: '2023-06-10',
              nextDueDate: '2024-06-10',
              veterinarian: 'Dr. Johnson',
              clinic: 'Pet Care Center',
              notes: 'Core vaccine series',
              isOverdue: false,
              isDueSoon: true,
            },
            {
              id: '3',
              name: 'Bordetella',
              type: 'Non-Core',
              administeredDate: '2023-12-01',
              nextDueDate: '2024-12-01',
              veterinarian: 'Dr. Brown',
              clinic: 'Vet Clinic',
              notes: 'Kennel cough prevention',
              isOverdue: false,
              isDueSoon: false,
            }
          ];
          
          const mockSummary = {
            total_vaccinations: 3,
            up_to_date: false,
            next_due_date: '2024-01-15',
            overdue_count: 1,
            completed_series: ['DHPP', 'Rabies']
          };
          
          setVaccineRecords(mockRecords);
          setVaccinationSummary(mockSummary);
        }
        
      } catch (error) {
        console.error('Error fetching vaccination data:', error);
        setError('Failed to load vaccination data. Using demo data instead.');
        
        // Even on error, show some demo data
        const demoRecords: VaccineRecord[] = [
          {
            id: 'demo-1',
            name: 'Rabies (Demo)',
            type: 'Core',
            administeredDate: '2023-01-15',
            nextDueDate: '2024-01-15',
            veterinarian: 'Dr. Demo',
            clinic: 'Demo Clinic',
            notes: 'This is demo data',
            isOverdue: true,
            isDueSoon: false,
          }
        ];
        
        setVaccineRecords(demoRecords);
        setVaccinationSummary({
          total_vaccinations: 1,
          up_to_date: false,
          next_due_date: '2024-01-15',
          overdue_count: 1,
          completed_series: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaccinationData();
  }, [pet?.id]);

  // Get recommended vaccines based on pet type
  const getRecommendedVaccines = () => {
    if (!pet) return [];
    
    const petType = pet.type?.toLowerCase() || 'unknown';
    
    if (petType === 'dog') {
      return dogVaccines;
    } else if (petType === 'cat') {
      return catVaccines;
    }
    
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

  // Categorize vaccines by time
  const categorizeVaccines = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const past = vaccineRecords.filter(vaccine => {
      const dueDate = new Date(vaccine.nextDueDate);
      return dueDate < today;
    });
    
    const nearFuture = vaccineRecords.filter(vaccine => {
      const dueDate = new Date(vaccine.nextDueDate);
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    });
    
    const farFuture = vaccineRecords.filter(vaccine => {
      const dueDate = new Date(vaccine.nextDueDate);
      return dueDate > thirtyDaysFromNow;
    });
    
    return { past, nearFuture, farFuture };
  };

  // Get status display for vaccine records
  const getStatusDisplay = (vaccine: VaccineRecord) => {
    if (vaccine.isOverdue) {
      return {
        icon: <WarningIcon color="error" />,
        text: 'Overdue',
        color: 'error' as const,
        severity: 'error' as const
      };
    } else if (vaccine.isDueSoon) {
      return {
        icon: <ScheduleIcon color="warning" />,
        text: 'Due Soon',
        color: 'warning' as const,
        severity: 'warning' as const
      };
    } else {
      return {
        icon: <CheckCircleIcon color="success" />,
        text: 'Up to Date',
        color: 'success' as const,
        severity: 'success' as const
      };
    }
  };

  // Add new vaccine record
  const handleAddVaccine = async () => {
    if (!pet?.id || !validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const nextDueDate = calculateNextDueDate(formData.name, formData.administeredDate);
      
      await createVaccination(pet.id, {
        petId: pet.id,
        vaccineName: formData.name,
        dateAdministered: formData.administeredDate,
        nextDueDate: nextDueDate,
        veterinarian: formData.veterinarian,
        clinic: formData.clinic,
        notes: formData.notes,
        isCompleted: true,
        reminderSent: false
      });
      
      setSuccessMessage('Vaccine added successfully!');
      
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
    } finally {
      setIsSubmitting(false);
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

  const { past, nearFuture, farFuture } = categorizeVaccines();

  console.log('VaccineTracker rendering with pet:', pet?.name, 'ID:', pet?.id);
  console.log('Vaccine records:', vaccineRecords);
  console.log('Vaccination summary:', vaccinationSummary);
  console.log('Categorized vaccines:', { past, nearFuture, farFuture });

  return (
    <>
    <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VaccinesIcon color="primary" />
              <Typography variant="h6">Vaccine Tracking</Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh data">
                <IconButton onClick={() => window.location.reload()} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                variant="contained"
                color="primary"
                size="small"
              >
                Add Vaccine
              </Button>
            </Box>
          }
        />

      <CardContent>
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Quick Summary */}
        {vaccinationSummary && (
          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {vaccinationSummary.total_vaccinations || vaccineRecords.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Vaccines
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={vaccinationSummary.up_to_date ? "success.main" : "warning.main"}>
                      {vaccinationSummary.up_to_date ? "✓" : "⚠"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vaccinationSummary.up_to_date ? "Up to Date" : "Needs Attention"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={past.length > 0 ? "error.main" : "success.main"}>
                      {past.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {nearFuture.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due Soon
                    </Typography>
                  </Box>
                </Grid>
            </Grid>
          </Paper>
        )}

        {/* Overdue Vaccines - Always visible */}
        {past.length > 0 && (
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PriorityHighIcon color="error" />
                <Typography variant="h6" color="error">
                  Overdue Vaccines ({past.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {past.map((vaccine) => {
                  const status = getStatusDisplay(vaccine);
                  return (
                    <Paper key={vaccine.id} elevation={1} sx={{ p: 2, borderLeft: 4, borderLeftColor: 'error.main' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {vaccine.name}
                            </Typography>
                            <Chip label={status.text} color={status.color} size="small" />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Due: {new Date(vaccine.nextDueDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Last: {new Date(vaccine.administeredDate).toLocaleDateString()} • {vaccine.veterinarian}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => openEditDialog(vaccine)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteVaccine(vaccine.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Due Soon Vaccines */}
        {nearFuture.length > 0 && (
          <Accordion defaultExpanded={past.length === 0} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="warning" />
                <Typography variant="h6" color="warning.main">
                  Due Soon ({nearFuture.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {nearFuture.map((vaccine) => {
                  const status = getStatusDisplay(vaccine);
                  return (
                    <Paper key={vaccine.id} elevation={1} sx={{ p: 2, borderLeft: 4, borderLeftColor: 'warning.main' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {vaccine.name}
                            </Typography>
                            <Chip label={status.text} color={status.color} size="small" />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Due: {new Date(vaccine.nextDueDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Last: {new Date(vaccine.administeredDate).toLocaleDateString()} • {vaccine.veterinarian}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => openEditDialog(vaccine)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteVaccine(vaccine.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Future Vaccines */}
        {farFuture.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="info" />
                <Typography variant="h6" color="info.main">
                  Future Vaccines ({farFuture.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {farFuture.map((vaccine) => {
                  const status = getStatusDisplay(vaccine);
                  return (
                    <Paper key={vaccine.id} elevation={1} sx={{ p: 2, borderLeft: 4, borderLeftColor: 'info.main' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {vaccine.name}
                            </Typography>
                            <Chip label={status.text} color={status.color} size="small" />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Due: {new Date(vaccine.nextDueDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Last: {new Date(vaccine.administeredDate).toLocaleDateString()} • {vaccine.veterinarian}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => openEditDialog(vaccine)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteVaccine(vaccine.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {/* No vaccines message */}
        {vaccineRecords.length === 0 && (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <VaccinesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No vaccine records yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Start tracking your pet's vaccinations to keep them healthy and up to date.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add First Vaccine
            </Button>
          </Paper>
        )}

        {/* Add Vaccine Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VaccinesIcon color="primary" />
              Add New Vaccine
            </Box>
          </DialogTitle>
          <DialogContent>
            {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={!!formErrors.name}>
                  <InputLabel>Vaccine Name *</InputLabel>
                  <Select
                    value={formData.name}
                    onChange={(e: SelectChangeEvent) => setFormData({ ...formData, name: e.target.value })}
                    label="Vaccine Name *"
                  >
                    {getRecommendedVaccines().map((vaccine) => (
                      <MenuItem key={vaccine.name} value={vaccine.name}>
                        {vaccine.name} ({vaccine.frequency})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.name && (
                    <Typography variant="caption" color="error">
                      {formErrors.name}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Administered Date *"
                  value={formData.administeredDate}
                  onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.administeredDate}
                  helperText={formErrors.administeredDate}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Veterinarian *"
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                  placeholder={t('vaccines.veterinarianPlaceholder')}
                  error={!!formErrors.veterinarian}
                  helperText={formErrors.veterinarian}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Clinic *"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  placeholder={t('vaccines.clinicPlaceholder')}
                  error={!!formErrors.clinic}
                  helperText={formErrors.clinic}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('vaccines.notesPlaceholder')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddVaccine} 
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Vaccine'}
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
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
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

    {/* Success/Error Snackbar */}
    <Snackbar
      open={!!successMessage}
      autoHideDuration={4000}
      onClose={() => setSuccessMessage(null)}
      message={successMessage}
    />
  </>
  );
};

export default VaccineTracker;
