import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  LinearProgress,
  Snackbar,
} from '@mui/material';
import {
  Vaccines as VaccinesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as HospitalIcon,
  PriorityHigh as PriorityHighIcon,
  Flag as FlagIcon,
  Science as ScienceIcon,
  LocalHospital as LocalHospitalIcon,
  FileDownload as ExportIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { getPets } from '../../services/pets/petService';
import { getAllVaccinations, getVaccinationsDueSoon, getOverdueVaccinations } from '../../services/vaccines/vaccineService';
import { downloadTasksAsICal, syncTasksWithGoogleCalendar } from '../../services/tasks/taskService';
import { israeliVaccineSchemas, vaccineNameTranslations } from '../../data/vaccines/israeliVaccines';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { Pet } from '../../types/pets/pet';
import type { VaccinationRecord } from '../../services/vaccines/vaccineService';
import type { Vaccine, VaccineSchema } from '../../data/vaccines/israeliVaccines';

interface VaccineDisplayRecord {
  id: string;
  petId: number;
  petName: string;
  vaccineName: string;
  type: string;
  administeredDate: string;
  nextDueDate: string;
  veterinarian: string;
  clinic: string;
  notes?: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  isCompleted: boolean;
  priority: 'mandatory' | 'recommended' | 'preventative';
  category: 'vaccination' | 'treatment';
}

interface VaccineSuggestion {
  name: string;
  description: string;
  frequency: string;
  priority: 'mandatory' | 'recommended' | 'preventative';
  category: 'vaccination' | 'treatment';
  nextDueDate?: string;
  isOverdue?: boolean;
  isDueSoon?: boolean;
  petId?: number;
  petName?: string;
}

interface VaccineTrackerProps {
  onAddVaccine?: () => void;
  onBack?: () => void;
}

const RealVaccineTracker: React.FC<VaccineTrackerProps> = ({ onAddVaccine, onBack }) => {
  const { t, currentLanguage } = useLocalization();
  
  // Get translated vaccine name
  const getTranslatedVaccineName = (name: string): string => {
    if (currentLanguage === 'he' && vaccineNameTranslations[name]) {
      return `${name} (${vaccineNameTranslations[name]})`;
    }
    return name;
  };
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccines, setVaccines] = useState<VaccineDisplayRecord[]>([]);
  const [suggestions, setSuggestions] = useState<VaccineSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<number | 'all'>('all');
  const [tabValue, setTabValue] = useState(0);
  const [region] = useState<'israel'>('israel'); // Can be expanded for other regions
  const [successMessage, setSuccessMessage] = useState('');

  // Get regional vaccine schema based on current region
  const getRegionalVaccineSchema = (pet: Pet): VaccineSchema => {
    const ageInWeeks = Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    
    if (region === 'israel') {
      if (pet.type === 'dog') {
        // Only use puppy vaccines for pets actually under 16 weeks (4 months)
        const isPuppy = ageInWeeks > 0 && ageInWeeks <= 16;
        return isPuppy ? israeliVaccineSchemas.puppies : israeliVaccineSchemas.adultDogs;
      } else if (pet.type === 'cat') {
        // Only use kitten vaccines for pets actually under 16 weeks (4 months)
        const isKitten = ageInWeeks > 0 && ageInWeeks <= 16;
        return isKitten ? israeliVaccineSchemas.kittens : israeliVaccineSchemas.adultCats;
      }
    }
    
    // Default fallback
    return israeliVaccineSchemas.adultDogs;
  };

  // Generate vaccine suggestions for a pet
  const generateVaccineSuggestions = (pet: Pet): VaccineSuggestion[] => {
    const schema = getRegionalVaccineSchema(pet);
    const suggestions: VaccineSuggestion[] = [];
    
    // Add mandatory vaccines
    schema.mandatory.forEach(vaccine => {
      suggestions.push({
        name: vaccine.name,
        description: vaccine.description,
        frequency: vaccine.frequency,
        priority: 'mandatory',
        category: 'vaccination',
      });
    });
    
    // Add recommended vaccines
    schema.recommended.forEach(vaccine => {
      suggestions.push({
        name: vaccine.name,
        description: vaccine.description,
        frequency: vaccine.frequency,
        priority: 'recommended',
        category: 'vaccination',
      });
    });
    
    // Add preventative treatments
    schema.preventative_treatments.forEach(treatment => {
      suggestions.push({
        name: treatment.name,
        description: treatment.description,
        frequency: treatment.frequency,
        priority: 'preventative',
        category: 'treatment',
      });
    });
    
    return suggestions;
  };

  // Load pets and vaccine data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        
        const [petsData, vaccinationsData] = await Promise.all([
          getPets(),
          getAllVaccinations()
        ]);
        
        
        setPets(petsData);
        
        // Convert vaccination records to display format
        const today = new Date();
        const vaccineRecords: VaccineDisplayRecord[] = vaccinationsData.map(vaccination => {
          const pet = petsData.find(p => p.id === vaccination.pet_id);
        const dueDate = new Date(vaccination.next_due_date);
        // Set time to start of day for accurate date comparison
        const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const soonDate = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const isOverdue = dueDateStart < todayStart && !vaccination.is_completed;
        const isDueSoon = dueDateStart >= todayStart && dueDateStart <= soonDate;
        
          
          return {
            id: vaccination.id.toString(),
            petId: vaccination.pet_id,
            petName: pet?.name || 'Unknown Pet',
            vaccineName: getTranslatedVaccineName(vaccination.vaccine_name),
            type: vaccination.vaccine_type || 'Vaccination',
            administeredDate: vaccination.date_administered,
            nextDueDate: vaccination.next_due_date,
            veterinarian: vaccination.veterinarian,
            clinic: vaccination.clinic,
            notes: vaccination.notes || '',
            isOverdue,
            isDueSoon,
            isCompleted: vaccination.is_completed,
            priority: 'recommended', // Default, can be enhanced
            category: 'vaccination',
          };
        });
        
        // Generate suggestions for all pets
        const allSuggestions: VaccineSuggestion[] = [];
        petsData.forEach(pet => {
          const petSuggestions = generateVaccineSuggestions(pet);
          allSuggestions.push(...petSuggestions.map(suggestion => ({
            ...suggestion,
            petId: pet.id,
            petName: pet.name,
          })));
        });
        
        // Sort vaccines by due date (overdue first, then by date)
        const sortedVaccines = vaccineRecords.sort((a, b) => {
          // Overdue vaccines first
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
          
          // Then by due date
          const dateA = new Date(a.nextDueDate || 0);
          const dateB = new Date(b.nextDueDate || 0);
          return dateA.getTime() - dateB.getTime();
        });
        
        setVaccines(sortedVaccines);
        setSuggestions(allSuggestions);
      } catch (err) {
        console.error('Error loading vaccine data:', err);
        setError('Failed to load vaccine data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [region]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Export vaccines to calendar
  const handleExportVaccines = async () => {
    try {
      // Convert vaccine records to task format for calendar export
      const vaccineTasks = vaccines.map(vaccine => ({
        id: parseInt(vaccine.id),
        title: `${vaccine.vaccineName} - ${vaccine.petName}`,
        description: `Vaccine: ${vaccine.vaccineName}\nPet: ${vaccine.petName}\nType: ${vaccine.type}`,
        dateTime: vaccine.nextDueDate || new Date().toISOString(),
        petIds: vaccine.petId ? [vaccine.petId] : [],
        isCompleted: vaccine.isCompleted,
        repeatInterval: null,
        repeatUnit: null,
        repeatEndDate: null,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 1
      }));
      
      downloadTasksAsICal(vaccineTasks, 'pawfectpal-vaccines.ics');
      setSuccessMessage(t('vaccineTracking.vaccinesExported') || 'Vaccines exported to calendar!');
    } catch (err) {
      console.error('❌ Error exporting vaccines:', err);
      setError(t('vaccineTracking.failedToExportVaccines') || 'Failed to export vaccines');
    }
  };

  // Sync vaccines with Google Calendar
  const handleSyncVaccinesWithGoogle = async () => {
    try {
      // Convert vaccine records to task format for Google Calendar sync
      const vaccineTasks = vaccines.map(vaccine => ({
        id: parseInt(vaccine.id),
        title: `${vaccine.vaccineName} - ${vaccine.petName}`,
        description: `Vaccine: ${vaccine.vaccineName}\nPet: ${vaccine.petName}\nType: ${vaccine.type}`,
        dateTime: vaccine.nextDueDate || new Date().toISOString(),
        petIds: vaccine.petId ? [vaccine.petId] : [],
        isCompleted: vaccine.isCompleted,
        repeatInterval: null,
        repeatUnit: null,
        repeatEndDate: null,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 1
      }));
      
      await syncTasksWithGoogleCalendar(vaccineTasks);
      setSuccessMessage(t('vaccineTracking.vaccinesSynced') || 'Vaccines synced with Google Calendar!');
    } catch (err) {
      console.error('❌ Error syncing vaccines:', err);
      setError(t('vaccineTracking.failedToSyncVaccines') || 'Failed to sync vaccines');
    }
  };

  const getStatusInfo = (vaccine: VaccineDisplayRecord) => {
    if (vaccine.isOverdue) {
      return { color: 'error', icon: <WarningIcon />, text: 'Overdue' };
    } else if (vaccine.isDueSoon) {
      return { color: 'warning', icon: <ScheduleIcon />, text: 'Due Soon' };
    } else {
      return { color: 'success', icon: <CheckCircleIcon />, text: 'Up to Date' };
    }
  };

  const filteredVaccines = selectedPet === 'all' 
    ? vaccines 
    : vaccines.filter(v => v.petId === selectedPet);

  const filteredSuggestions = selectedPet === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.petId === selectedPet);

  const overdueVaccines = filteredVaccines.filter(v => v.isOverdue);
  const dueSoonVaccines = filteredVaccines.filter(v => v.isDueSoon);
  const upToDateVaccines = filteredVaccines.filter(v => !v.isOverdue && !v.isDueSoon);

  const totalVaccines = filteredVaccines.length;
  const overdueCount = overdueVaccines.length;
  const dueSoonCount = dueSoonVaccines.length;
  const upToDateCount = upToDateVaccines.length;
  const suggestionsCount = filteredSuggestions.length;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              {t('vaccines.loadingVaccineData')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {t('vaccines.failedToLoadVaccineData')}
      </Alert>
    );
  }

  return (
    <Box>
             {/* Header */}
             <Card sx={{ mb: 3 }}>
               <CardHeader
                 avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><VaccinesIcon /></Avatar>}
                 title={t('vaccines.title') || 'Vaccines'}
                 subheader={t('vaccineTracking.manageYourVaccines') || 'Track and manage your pet vaccinations'}
                 action={
                   <Box display="flex" gap={1}>
                     {onBack && (
                       <Button variant="outlined" onClick={onBack}>
                         {t('vaccines.backToTasks')}
                       </Button>
                     )}
                     <Tooltip title={t('vaccines.exportToICal') || 'Export to Calendar'}>
                       <IconButton onClick={handleExportVaccines}>
                         <ExportIcon />
                       </IconButton>
                     </Tooltip>
                     <Tooltip title={t('vaccines.syncWithGoogleCalendar') || 'Sync with Google Calendar'}>
                       <IconButton onClick={handleSyncVaccinesWithGoogle}>
                         <SyncIcon />
                       </IconButton>
                     </Tooltip>
                     <Tooltip title={t('vaccines.refresh')}>
                       <IconButton onClick={() => window.location.reload()}>
                         <RefreshIcon />
                       </IconButton>
                     </Tooltip>
                     {onAddVaccine && (
                       <Button
                         variant="contained"
                         startIcon={<AddIcon />}
                         onClick={onAddVaccine}
                         size="small"
                       >
                         {t('vaccines.addVaccine')}
                       </Button>
                     )}
                   </Box>
                 }
               />
             </Card>

      {/* Pet Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>{t('vaccines.filterByPet')}</InputLabel>
              <Select
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value as number | 'all')}
                label={t('vaccines.filterByPet')}
              >
                <MenuItem value="all">{t('vaccines.allPets')}</MenuItem>
                {pets.map(pet => (
                  <MenuItem key={pet.id} value={pet.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PetsIcon fontSize="small" />
                      {pet.name} ({pet.type} - {pet.breed})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {totalVaccines}
            </Typography>
            <Typography variant="body2">
              {t('vaccines.totalVaccines') || 'Total Vaccines'}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'error.main', color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {overdueCount}
            </Typography>
            <Typography variant="body2">
              {t('vaccines.overdue') || 'Overdue'}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {dueSoonCount}
            </Typography>
            <Typography variant="body2">
              {t('vaccines.dueSoon') || 'Due Soon'}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.main', color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {upToDateCount}
            </Typography>
            <Typography variant="body2">
              {t('vaccines.upToDate') || 'Up to Date'}
            </Typography>
          </Card>
        </Grid>
      </Grid>

             {/* Tabs for different vaccine categories */}
             <Card>
               <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                 <Tabs value={tabValue} onChange={handleTabChange} aria-label="vaccine categories">
                   <Tab label={`${t('vaccines.overdue')} (${overdueCount})`} />
                   <Tab label={`${t('vaccines.dueSoon')} (${dueSoonCount})`} />
                   <Tab label={`${t('vaccines.upToDate')} (${upToDateCount})`} />
                   <Tab label={`${t('vaccines.allRecords')} (${totalVaccines})`} />
                   <Tab label={`${t('vaccines.suggestions')} (${suggestionsCount})`} />
                 </Tabs>
               </Box>

               <CardContent>
                 {tabValue === 0 && (
                   <VaccineList vaccines={overdueVaccines} title={t('vaccines.overdueVaccines')} />
                 )}
                 {tabValue === 1 && (
                   <VaccineList vaccines={dueSoonVaccines} title={t('vaccines.dueSoonVaccines')} />
                 )}
                 {tabValue === 2 && (
                   <VaccineList vaccines={upToDateVaccines} title={t('vaccines.upToDateVaccines')} />
                 )}
                 {tabValue === 3 && (
                   <VaccineList vaccines={filteredVaccines} title={t('vaccines.allVaccineRecords')} />
                 )}
                 {tabValue === 4 && (
                   <VaccineSuggestionsList suggestions={filteredSuggestions} title={t('vaccines.regionalVaccineSuggestions')} />
                 )}
               </CardContent>
        </Card>
        
        {/* Success Snackbar */}
        <Snackbar 
          open={!!successMessage} 
          autoHideDuration={6000} 
          onClose={() => setSuccessMessage('')}
        >
          <Alert onClose={() => setSuccessMessage('')} severity="success">
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  };

interface VaccineListProps {
  vaccines: VaccineDisplayRecord[];
  title: string;
}

const VaccineList: React.FC<VaccineListProps> = ({ vaccines, title }) => {
  const { t } = useLocalization();
  
  const getStatusInfo = (vaccine: VaccineDisplayRecord) => {
    if (vaccine.isOverdue) {
      return { 
        color: 'error', 
        icon: <PriorityHighIcon />, 
        text: t('vaccines.overdue'),
        bgColor: 'error.light',
        borderColor: 'error.main'
      };
    } else if (vaccine.isDueSoon) {
      return { 
        color: 'warning', 
        icon: <ScheduleIcon />, 
        text: t('vaccines.dueSoon'),
        bgColor: 'warning.light',
        borderColor: 'warning.main'
      };
    } else {
      return { 
        color: 'success', 
        icon: <CheckCircleIcon />, 
        text: t('vaccines.upToDate'),
        bgColor: 'success.light',
        borderColor: 'success.main'
      };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'mandatory':
        return { color: 'error', icon: <FlagIcon />, text: t('vaccines.mandatory') };
      case 'recommended':
        return { color: 'primary', icon: <ScienceIcon />, text: t('vaccines.recommended') };
      case 'preventative':
        return { color: 'info', icon: <LocalHospitalIcon />, text: t('vaccines.preventative') };
      default:
        return { color: 'default', icon: <ScienceIcon />, text: t('vaccines.other') };
    }
  };

  if (vaccines.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <VaccinesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t('vaccines.noVaccinesFound')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title === 'All Vaccines' ? t('vaccines.noVaccineRecordsFound') : `${t('vaccines.noVaccinesAre')} ${title.toLowerCase()}.`}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {vaccines.map((vaccine) => {
        const status = getStatusInfo(vaccine);
         return (
           <Paper 
             key={vaccine.id} 
             sx={{ 
               p: 2, 
               borderLeft: 4, 
               borderLeftColor: status.borderColor,
               backgroundColor: status.bgColor,
               mb: 1,
               transition: 'all 0.2s ease-in-out',
               '&:hover': {
                 boxShadow: 2,
                 transform: 'translateY(-1px)'
               }
             }}
           >
             <Box display="flex" justifyContent="space-between" alignItems="flex-start">
               <Box flex={1}>
                 <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                   <Typography variant="h6" sx={{ fontWeight: 600 }}>
                     {vaccine.vaccineName}
                   </Typography>
                   <Chip 
                     label={status.text} 
                     color={status.color as any} 
                     size="small" 
                     icon={status.icon}
                     sx={{ fontWeight: 500 }}
                   />
                   <Chip 
                     label={vaccine.petName} 
                     color="primary" 
                     size="small" 
                     icon={<PetsIcon />}
                     variant="outlined"
                   />
                   {vaccine.priority && (
                     <Chip 
                       label={getPriorityInfo(vaccine.priority).text} 
                       color={getPriorityInfo(vaccine.priority).color as any} 
                       size="small" 
                       icon={getPriorityInfo(vaccine.priority).icon}
                       variant="outlined"
                     />
                   )}
                 </Box>
                 <Stack spacing={1}>
                   <Typography variant="body2" color="text.secondary">
                     <strong>{t('vaccines.administered')}:</strong> {new Date(vaccine.administeredDate).toLocaleDateString()}
                   </Typography>
                   <Typography variant="body2" color="text.secondary">
                     <strong>{t('vaccines.nextDue')}:</strong> {new Date(vaccine.nextDueDate).toLocaleDateString()}
                   </Typography>
                   <Typography variant="body2" color="text.secondary">
                     <strong>{t('vaccines.veterinarian')}:</strong> {vaccine.veterinarian} {t('vaccines.at')} {vaccine.clinic}
                   </Typography>
                   {vaccine.notes && (
                     <Typography variant="body2" color="text.secondary">
                       <strong>{t('vaccines.notes')}:</strong> {vaccine.notes}
                     </Typography>
                   )}
                 </Stack>
               </Box>
               <Box>
                 <Tooltip title={t('vaccines.edit')}>
                   <IconButton size="small" color="primary">
                     <EditIcon />
                   </IconButton>
                 </Tooltip>
                 <Tooltip title={t('vaccines.delete')}>
                   <IconButton size="small" color="error">
                     <DeleteIcon />
                   </IconButton>
                 </Tooltip>
               </Box>
             </Box>
           </Paper>
         );
      })}
    </Stack>
  );
};

interface VaccineSuggestionsListProps {
  suggestions: VaccineSuggestion[];
  title: string;
}

const VaccineSuggestionsList: React.FC<VaccineSuggestionsListProps> = ({ suggestions, title }) => {
  const { t } = useLocalization();
  
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'mandatory':
        return { color: 'error', icon: <FlagIcon />, text: t('vaccines.mandatory'), bgColor: 'error.light', borderColor: 'error.main' };
      case 'recommended':
        return { color: 'primary', icon: <ScienceIcon />, text: t('vaccines.recommended'), bgColor: 'primary.light', borderColor: 'primary.main' };
      case 'preventative':
        return { color: 'info', icon: <LocalHospitalIcon />, text: t('vaccines.preventative'), bgColor: 'info.light', borderColor: 'info.main' };
      default:
        return { color: 'default', icon: <ScienceIcon />, text: 'Other', bgColor: 'grey.100', borderColor: 'grey.300' };
    }
  };

  if (suggestions.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <ScienceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t('vaccines.noVaccineSuggestions')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('vaccines.noRegionalSuggestions')}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlagIcon color="primary" />
        {title} - {t('vaccines.israeliStandards')}
      </Typography>
      
      {suggestions.map((suggestion, index) => {
        const priority = getPriorityInfo(suggestion.priority);
        return (
          <Paper 
            key={`${suggestion.name}-${index}`}
            sx={{ 
              p: 2, 
              borderLeft: 4, 
              borderLeftColor: priority.borderColor,
              backgroundColor: priority.bgColor,
              mb: 1,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {suggestion.name}
                  </Typography>
                  <Chip 
                    label={priority.text} 
                    color={priority.color as any} 
                    size="small" 
                    icon={priority.icon}
                    sx={{ fontWeight: 500 }}
                  />
                  <Chip 
                    label={suggestion.category === 'vaccination' ? t('vaccines.vaccination') : t('vaccines.treatment')} 
                    color="secondary" 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={suggestion.frequency} 
                    color="default" 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {suggestion.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <strong>{t('vaccines.frequency')}:</strong> {suggestion.frequency}
                </Typography>
              </Box>
              <Box>
                <Tooltip title={t('vaccines.addToSchedule')}>
                  <IconButton size="small" color="primary">
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default RealVaccineTracker;
